/**
 * crime.js — Per-faction bounties, crime tracking, and security response (Pillar 3).
 */

const BALANCE = require("./balance");

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const defaultCrimeState = () => ({
  bountyByFaction: {},
  wantedLevel: 0,
  lastCrimeTs: 0
});

const initCrime = (player) => {
  if (!player.bountyByFaction) player.bountyByFaction = {};
  if (player.wantedLevel === undefined || player.wantedLevel === null) player.wantedLevel = 0;
  if (!player.lastCrimeTs) player.lastCrimeTs = 0;
};

/**
 * Add a crime. crimeKey must match a key in BALANCE.crime (e.g. "bountyForKillSecurity").
 * Returns the bounty amount added.
 */
const addCrime = (player, crimeKey, factionId) => {
  initCrime(player);
  const amount = BALANCE.crime[crimeKey] ?? 500;
  if (factionId) {
    player.bountyByFaction[factionId] =
      (player.bountyByFaction[factionId] ?? 0) + amount;
  }
  player.wantedLevel = getTotalBounty(player);
  player.lastCrimeTs = Date.now();
  return amount;
};

/**
 * Sum all faction bounties.
 */
const getTotalBounty = (player) => {
  if (!player.bountyByFaction) return 0;
  return Object.values(player.bountyByFaction).reduce((sum, b) => sum + b, 0);
};

const getWantedLabel = (wantedLevel) => {
  if (wantedLevel >= BALANCE.crime.swarmLevel) return "Fugitive";
  if (wantedLevel >= BALANCE.crime.interceptLevel) return "Wanted";
  if (wantedLevel >= BALANCE.crime.warnLevel) return "Suspect";
  return "Clean";
};

/**
 * Returns "none" | "warn" | "intercept" | "swarm".
 */
const getSecurityResponseLevel = (wantedLevel) => {
  if (wantedLevel >= BALANCE.crime.swarmLevel) return "swarm";
  if (wantedLevel >= BALANCE.crime.interceptLevel) return "intercept";
  if (wantedLevel >= BALANCE.crime.warnLevel) return "warn";
  return "none";
};

/**
 * Chance that security ships spawn when the player enters/jumps in a system.
 */
const getSecuritySpawnChance = (player, systemSecurityLevel = 1) => {
  const responseLevel = getSecurityResponseLevel(player.wantedLevel ?? 0);
  const baseChance = BALANCE.crime.securitySpawnChance[responseLevel] ?? 0;
  // Scale by system security level (1–3)
  return clamp(baseChance * (systemSecurityLevel / 2), 0, 1);
};

/**
 * Attempt to clear bounty for a faction (pay it off at station). 
 * Returns amount paid, 0 if no bounty, -1 if insufficient credits.
 */
const clearFactionBounty = (player, factionId) => {
  initCrime(player);
  const amount = player.bountyByFaction[factionId] ?? 0;
  if (amount <= 0) return 0;
  if (player.credits < amount) return -1;
  player.credits -= amount;
  delete player.bountyByFaction[factionId];
  player.wantedLevel = getTotalBounty(player);
  return amount;
};

module.exports = {
  defaultCrimeState,
  initCrime,
  addCrime,
  getTotalBounty,
  getWantedLabel,
  getSecurityResponseLevel,
  getSecuritySpawnChance,
  clearFactionBounty
};
