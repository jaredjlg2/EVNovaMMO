/**
 * balance.js — All tunable gameplay constants in one place.
 * Change values here to tweak gameplay without touching logic files.
 */

const BALANCE = {
  // ─── PILLAR 1: Ship Energy & Heat ────────────────────────────────────────
  energy: {
    weaponCapMax: 100,
    engineCapMax: 100,
    shieldCapMax: 100,

    // Drain per action
    weaponCapDrainPerShot: 18,
    engineCapDrainPerBoostSecond: 10,

    // Base regen per second (at balanced distribution)
    weaponCapRegenBase: 14,
    engineCapRegenBase: 14,
    shieldCapRegenBase: 10,

    // Power multiplier: 0%=0.4x, 50%=1.0x, 100%=1.6x
    powerAllocMin: 0.4,
    powerAllocMax: 1.6,

    // Heat
    heatPerShot: 8,
    heatPerBoostSecond: 5,
    heatDecayRate: 5, // per second passive
    heatWarningThreshold: 60,
    heatCriticalThreshold: 85,
    heatHullDamagePerSecond: 0.8,
    heatAccuracyMissProbability: 0.35, // chance shot does zero dmg at critical heat

    // Heat sink consumable / vent
    heatSinkDrainPerSecond: 40,
    heatSinkDuration: 2,
    heatSinkCooldown: 20
  },

  // ─── PILLAR 2: Cruise & Interdiction ─────────────────────────────────────
  cruise: {
    spoolUpTime: 3, // seconds
    spoolDownTime: 2,
    speedMultiplier: 3.5,
    turnRateMultiplier: 0.25,

    // Chance per second of being interdicted while cruising
    interdictionChancePerSecond: {
      core: 0.003,
      border: 0.01,
      frontier: 0.022
    },

    interdictionWindowSeconds: 8,

    // Probability that interdicting AI pursues into normal space if player evades
    pursuitChance: {
      core: 0.15,
      border: 0.4,
      frontier: 0.7
    }
  },

  // ─── PILLAR 3: Crime, Bounties & Security ────────────────────────────────
  crime: {
    bountyForPiracyDemand: 600,
    bountyForKillCivilian: 1800,
    bountyForKillSecurity: 3500,
    bountyForSmuggling: 500,
    bountyForBoardingKill: 1200,

    // Wanted-level thresholds (sum of all faction bounties)
    warnLevel: 500,
    interceptLevel: 2000,
    swarmLevel: 6000,

    // Chance security ships spawn per jump when wanted
    securitySpawnChance: {
      warn: 0.25,
      intercept: 0.6,
      swarm: 1.0
    },

    // Kill-Warrant Scanner: increases bounty payout and scan chance
    killWarrantScanPenalty: 1.4
  },

  // ─── PILLAR 4: Salvage & Piracy ──────────────────────────────────────────
  salvage: {
    wreckLifeSeconds: 120,
    scoopTimeSeconds: 4,
    scoopRange: 90,
    cargoSpillProbability: 0.65,
    dataCoreProbability: 0.18,
    dataCoreValue: 2800,

    // Piracy demand
    demandComplianceFine: 400, // legal hit for issuing demand
    demandLootFraction: 0.6, // fraction of cargo victim drops on comply
    piracyDiminishingReturnMs: 300000 // 5 min cooldown per victim
  },

  // ─── PILLAR 5: Risk-gradient market multipliers ───────────────────────────
  market: {
    // Applied to sell price at each tier
    sellMultiplier: {
      core: 0.88,
      border: 1.0,
      frontier: 1.32
    },
    // Applied to buy price at each tier (frontier goods cost more to buy too)
    buyMultiplier: {
      core: 1.05,
      border: 1.0,
      frontier: 0.92
    }
  }
};

module.exports = BALANCE;
