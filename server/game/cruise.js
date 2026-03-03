/**
 * cruise.js — Cruise mode and interdiction events (Pillar 2).
 * Cruise: high speed, low turning, weapons disabled; spool up/down required.
 * Interdiction: AI can pull players out of cruise with a short reaction window.
 */

const BALANCE = require("./balance");
const { systems } = require("./data");

const systemById = new Map(systems.map((s) => [s.id, s]));

// Active interdiction events keyed by playerId
const interdictions = new Map();

const defaultCruise = () => ({
  spoolPhase: "idle", // "idle" | "spoolingUp" | "active" | "spoolingDown"
  spoolTimer: 0
});

const initCruise = (player) => {
  if (!player.cruise) {
    player.cruise = defaultCruise();
    return;
  }
  if (!player.cruise.spoolPhase) {
    player.cruise.spoolPhase = "idle";
    player.cruise.spoolTimer = 0;
  }
};

const getSystemTier = (systemId) =>
  systemById.get(systemId)?.status ?? "border";

const isCruiseActive = (player) => {
  initCruise(player);
  return player.cruise.spoolPhase === "active";
};

const isCruiseBusy = (player) => {
  initCruise(player);
  const p = player.cruise.spoolPhase;
  return p === "spoolingUp" || p === "spoolingDown";
};

/**
 * Toggle cruise on/off. Returns { ok, message }.
 */
const toggleCruise = (player) => {
  initCruise(player);
  if (player.planetId) {
    return { ok: false, message: "Cannot engage cruise while docked." };
  }
  const phase = player.cruise.spoolPhase;
  if (phase === "idle") {
    player.cruise.spoolPhase = "spoolingUp";
    player.cruise.spoolTimer = BALANCE.cruise.spoolUpTime;
    return { ok: true, message: "Cruise drive spooling up…" };
  }
  if (phase === "active" || phase === "spoolingUp") {
    player.cruise.spoolPhase = "spoolingDown";
    player.cruise.spoolTimer = BALANCE.cruise.spoolDownTime;
    return { ok: true, message: "Cruise drive disengaging…" };
  }
  return { ok: true, message: "Cruise in transition." };
};

/**
 * Interrupt cruise immediately (e.g. on taking damage, combat).
 */
const interruptCruise = (player, reason = "") => {
  initCruise(player);
  const phase = player.cruise.spoolPhase;
  if (phase === "idle") return null;
  player.cruise.spoolPhase = "idle";
  player.cruise.spoolTimer = 0;
  return `Cruise interrupted${reason ? `: ${reason}` : ""}.`;
};

/**
 * Advance cruise spool timer each tick.
 */
const tickCruise = (player, deltaSeconds) => {
  initCruise(player);
  const c = player.cruise;
  if (c.spoolPhase === "spoolingUp") {
    c.spoolTimer = Math.max(0, c.spoolTimer - deltaSeconds);
    if (c.spoolTimer === 0) {
      c.spoolPhase = "active";
    }
  } else if (c.spoolPhase === "spoolingDown") {
    c.spoolTimer = Math.max(0, c.spoolTimer - deltaSeconds);
    if (c.spoolTimer === 0) {
      c.spoolPhase = "idle";
    }
  }
};

/**
 * Per-tick check: should this player be interdicted?
 * Returns the event object if a new interdiction starts, null otherwise.
 */
const checkInterdiction = (player) => {
  if (!isCruiseActive(player)) return null;
  if (interdictions.has(player.id)) return null;

  const tier = getSystemTier(player.systemId);
  const chancePerSecond = BALANCE.cruise.interdictionChancePerSecond[tier] ?? 0.005;

  // Convert per-second chance to per-tick using pre-computed delta in caller
  if (Math.random() > chancePerSecond) return null;

  const event = {
    playerId: player.id,
    startedAt: Date.now(),
    windowMs: BALANCE.cruise.interdictionWindowSeconds * 1000,
    tier,
    resolved: false
  };
  interdictions.set(player.id, event);
  return event;
};

const getInterdiction = (playerId) => interdictions.get(playerId) ?? null;

/**
 * Player responds to an interdiction.
 * action: "submit" | "evade"
 * Returns { ok, result, message, pursueProbability }.
 */
const resolveInterdiction = (player, action) => {
  const event = interdictions.get(player.id);
  if (!event) {
    return { ok: false, message: "No active interdiction." };
  }
  interdictions.delete(player.id);
  interruptCruise(player);

  if (action === "submit") {
    const fine = 600;
    player.credits = Math.max(0, player.credits - fine);
    return {
      ok: true,
      result: "submitted",
      message: `Submitted to interdiction. Fine: ${fine} credits.`,
      pursueProbability: 0
    };
  }

  const tier = event.tier;
  const pursueProbability = BALANCE.cruise.pursuitChance[tier] ?? 0.4;
  return {
    ok: true,
    result: "evaded",
    message: "You broke out of the interdiction field!",
    pursueProbability,
    tier
  };
};

const clearInterdiction = (playerId) => {
  interdictions.delete(playerId);
};

module.exports = {
  defaultCruise,
  initCruise,
  isCruiseActive,
  isCruiseBusy,
  toggleCruise,
  interruptCruise,
  tickCruise,
  checkInterdiction,
  getInterdiction,
  resolveInterdiction,
  clearInterdiction
};
