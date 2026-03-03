/**
 * energy.js — Ship capacitors and heat management (Pillar 1).
 * Server-authoritative: outcomes are computed here and sent to the client.
 */

const BALANCE = require("./balance");

const E = BALANCE.energy;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const defaultEnergy = () => ({
  weaponCap: E.weaponCapMax,
  engineCap: E.engineCapMax,
  shieldCap: E.shieldCapMax,
  heat: 0,
  heatSinkCooldown: 0,
  heatSinkActive: false,
  heatSinkTimer: 0,
  powerDist: { wep: 33, eng: 34, sys: 33 }
});

const initEnergy = (player) => {
  if (!player.energy) {
    player.energy = defaultEnergy();
    return;
  }
  // Backfill missing keys for existing players
  const d = defaultEnergy();
  player.energy = { ...d, ...player.energy };
  if (!player.energy.powerDist) {
    player.energy.powerDist = d.powerDist;
  }
};

const getPowerMultiplier = (alloc) => {
  // alloc is 0–100; returns E.powerAllocMin–E.powerAllocMax
  const frac = clamp(alloc, 0, 100) / 100;
  return E.powerAllocMin + frac * (E.powerAllocMax - E.powerAllocMin);
};

/**
 * Tick energy state every server frame.
 */
const tickEnergy = (player, deltaSeconds) => {
  initEnergy(player);
  const en = player.energy;
  const dist = en.powerDist;

  // Regen capacitors
  en.weaponCap = clamp(
    en.weaponCap + E.weaponCapRegenBase * getPowerMultiplier(dist.wep) * deltaSeconds,
    0,
    E.weaponCapMax
  );
  en.engineCap = clamp(
    en.engineCap + E.engineCapRegenBase * getPowerMultiplier(dist.eng) * deltaSeconds,
    0,
    E.engineCapMax
  );
  en.shieldCap = clamp(
    en.shieldCap + E.shieldCapRegenBase * getPowerMultiplier(dist.sys) * deltaSeconds,
    0,
    E.shieldCapMax
  );

  // Heat: passive decay or active vent
  if (en.heatSinkActive) {
    en.heat = Math.max(0, en.heat - E.heatSinkDrainPerSecond * deltaSeconds);
    en.heatSinkTimer = Math.max(0, en.heatSinkTimer - deltaSeconds);
    if (en.heatSinkTimer <= 0) {
      en.heatSinkActive = false;
    }
  } else {
    en.heat = Math.max(0, en.heat - E.heatDecayRate * deltaSeconds);
  }
  if (en.heatSinkCooldown > 0) {
    en.heatSinkCooldown = Math.max(0, en.heatSinkCooldown - deltaSeconds);
  }

  // Critical heat: hull damage
  if (en.heat >= E.heatCriticalThreshold) {
    player.hull = Math.max(0, player.hull - E.heatHullDamagePerSecond * deltaSeconds);
  }
};

/**
 * Try to drain weapon capacitor for a shot. Returns false if no cap available.
 */
const drainWeaponCap = (player) => {
  initEnergy(player);
  const en = player.energy;
  if (en.weaponCap < E.weaponCapDrainPerShot) {
    return false;
  }
  en.weaponCap -= E.weaponCapDrainPerShot;
  en.heat = clamp(en.heat + E.heatPerShot, 0, 100);
  return true;
};

/**
 * Drain engine capacitor for boosting. Returns false if no cap available.
 */
const drainEngineCap = (player, deltaSeconds) => {
  initEnergy(player);
  const en = player.energy;
  const drain = E.engineCapDrainPerBoostSecond * deltaSeconds;
  if (en.engineCap < drain) {
    return false;
  }
  en.engineCap -= drain;
  en.heat = clamp(en.heat + E.heatPerBoostSecond * deltaSeconds, 0, 100);
  return true;
};

/**
 * Activate heat sink (vent). Returns ok/message.
 */
const ventHeat = (player) => {
  initEnergy(player);
  const en = player.energy;
  if (en.heatSinkCooldown > 0) {
    return {
      ok: false,
      message: `Heat sink recharging (${Math.ceil(en.heatSinkCooldown)}s).`
    };
  }
  if (en.heat <= 0) {
    return { ok: false, message: "Heat levels nominal." };
  }
  en.heatSinkActive = true;
  en.heatSinkTimer = E.heatSinkDuration;
  en.heatSinkCooldown = E.heatSinkCooldown;
  return { ok: true, message: "Heat vent activated." };
};

/**
 * Set power distribution preset. wep + eng + sys must sum to ~100.
 */
const setPowerDistribution = (player, wep, eng, sys) => {
  const total = wep + eng + sys;
  if (total < 98 || total > 102) {
    return { ok: false, message: "Power allocation must sum to 100." };
  }
  initEnergy(player);
  player.energy.powerDist = {
    wep: clamp(Math.round(wep), 0, 100),
    eng: clamp(Math.round(eng), 0, 100),
    sys: clamp(Math.round(sys), 0, 100)
  };
  return { ok: true };
};

/**
 * Returns a probability of shot missing due to heat (0–1).
 */
const getHeatMissProbability = (player) => {
  initEnergy(player);
  const heat = player.energy.heat;
  if (heat >= E.heatCriticalThreshold) {
    return E.heatAccuracyMissProbability;
  }
  if (heat >= E.heatWarningThreshold) {
    return E.heatAccuracyMissProbability * 0.5;
  }
  return 0;
};

module.exports = {
  defaultEnergy,
  initEnergy,
  tickEnergy,
  drainWeaponCap,
  drainEngineCap,
  ventHeat,
  setPowerDistribution,
  getHeatMissProbability
};
