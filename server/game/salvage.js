/**
 * salvage.js — Wrecks, cargo scooping, and piracy demand (Pillar 4).
 */

const BALANCE = require("./balance");

// Global wreck pool
const wrecks = new Map();
let wreckCounter = 0;

/**
 * Spawn a wreck from a destroyed ship.
 * @param {object} ship - The destroyed AI ship object.
 * @returns {object} The new wreck.
 */
const spawnWreck = (ship) => {
  wreckCounter += 1;
  const id = `wreck_${wreckCounter}_${Date.now()}`;
  const loot = [];

  // Spill cargo with probability
  (ship.cargo || []).forEach((entry) => {
    if (Math.random() < BALANCE.salvage.cargoSpillProbability) {
      loot.push({ ...entry });
    }
  });

  // Data core random drop
  if (Math.random() < BALANCE.salvage.dataCoreProbability) {
    loot.push({ goodId: "data_core", quantity: 1, value: BALANCE.salvage.dataCoreValue });
  }

  const wreck = {
    id,
    name: `Wreck: ${ship.name}`,
    systemId: ship.systemId,
    x: ship.x + (Math.random() - 0.5) * 24,
    y: ship.y + (Math.random() - 0.5) * 24,
    loot,
    lifeRemaining: BALANCE.salvage.wreckLifeSeconds,
    scoopProgress: {} // playerId -> seconds spent scooping
  };
  wrecks.set(id, wreck);
  return wreck;
};

const getWreck = (wreckId) => wrecks.get(wreckId) ?? null;

const getWrecksInSystem = (systemId) =>
  Array.from(wrecks.values()).filter((w) => w.systemId === systemId);

/**
 * Decay all wrecks. Returns array of expired wreck IDs.
 */
const tickWrecks = (deltaSeconds) => {
  const expired = [];
  wrecks.forEach((wreck, id) => {
    wreck.lifeRemaining -= deltaSeconds;
    if (wreck.lifeRemaining <= 0) {
      expired.push(id);
    }
  });
  expired.forEach((id) => wrecks.delete(id));
  return expired;
};

/**
 * Progress a scoop attempt. Call each tick while player holds G near a wreck.
 * Returns { ok, completed, progress, loot }.
 */
const tickScoopProgress = (player, wreckId, deltaSeconds) => {
  const wreck = wrecks.get(wreckId);
  if (!wreck) {
    return { ok: false, message: "Wreck no longer present." };
  }
  const distance = Math.hypot(player.x - wreck.x, player.y - wreck.y);
  if (distance > BALANCE.salvage.scoopRange) {
    wreck.scoopProgress[player.id] = 0;
    return { ok: false, message: "Too far from wreck." };
  }
  wreck.scoopProgress[player.id] = (wreck.scoopProgress[player.id] ?? 0) + deltaSeconds;
  if (wreck.scoopProgress[player.id] >= BALANCE.salvage.scoopTimeSeconds) {
    const loot = wreck.loot.slice();
    wrecks.delete(wreckId);
    return { ok: true, completed: true, loot };
  }
  return {
    ok: true,
    completed: false,
    progress: wreck.scoopProgress[player.id] / BALANCE.salvage.scoopTimeSeconds
  };
};

// Anti-abuse map: `${pirateId}_${victimId}` -> timestamp
const piracyTimestamps = new Map();

const canDemandFromVictim = (pirateId, victimId) => {
  const key = `${pirateId}_${victimId}`;
  const last = piracyTimestamps.get(key) ?? 0;
  return Date.now() - last >= BALANCE.salvage.piracyDiminishingReturnMs;
};

const recordPiracyDemand = (pirateId, victimId) => {
  piracyTimestamps.set(`${pirateId}_${victimId}`, Date.now());
};

module.exports = {
  spawnWreck,
  getWreck,
  getWrecksInSystem,
  tickWrecks,
  tickScoopProgress,
  canDemandFromVictim,
  recordPiracyDemand
};
