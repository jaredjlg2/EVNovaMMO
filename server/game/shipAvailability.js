/**
 * Ship Availability System
 *
 * Determines which ships are purchasable in a given star system based on:
 *   - System metadata (type, shipyard tier, tech level, population)
 *   - Ship requirements (required shipyard level, min tech, min population)
 *   - Faction territory rules (faction ships sold in their own systems)
 *   - Special regional availability (unique ships tied to specific system types)
 *
 * System metadata is derived from existing fields (status, zoneType, tags, traffic,
 * factionId, capitalOf) so no new data storage is required for most systems.
 *
 * FACTION PHILOSOPHIES
 * ─────────────────────
 *  solar_directorate   — Balanced military: modular fighters, gunships, cruisers
 *  ironclad_clans      — Heavy armored warships: slow, high hull, brutal boarding
 *  echotrail_communion — Advanced shields/energy: bio-ships, psychic disruptors
 *  luminari_compact    — Fast exotic drives: stealth, high-speed interceptors
 *  free_horizons_guild — Flexible traders: modular freighters, escort gunships
 *  black_flag_syndicate— Pirate raids: cheap, fast, aggressive raider ships
 *  starseed_foundation — Colonial logistics: mining, agricultural, heavy cargo
 *  obsidian_covenant   — Void tech: corruption weapons, entropy fields
 *
 * SYSTEM TYPES
 * ─────────────
 *  capital          — Faction homeworld; tier 5 shipyard, all faction ships
 *  core_world       — Developed core system; tier 3–4 shipyard
 *  trade_hub        — High-traffic commerce nexus; neutral + faction ships
 *  industrial       — Heavy manufacturing; freighters and gunships
 *  agricultural     — Farming/terraforming worlds; traders and haulers
 *  mining           — Extraction worlds; mining ships and heavy freighters
 *  frontier         — Sparse settlements; starter ships only
 *  pirate_haven     — Lawless pirate bases; black-market and pirate ships
 *  research_outpost — Science stations; high-tech and exotic ships
 *  contested        — Active conflict zones; military ships from both sides
 *
 * AVAILABILITY ALGORITHM
 * ──────────────────────
 * 1. Derive system metadata from existing fields.
 * 2. Determine which factions may sell ships here.
 * 3. Filter ships by shipyard tier, tech level, population.
 * 4. Apply special regional overrides (unique/prototype ships).
 */

const { ships, factions } = require("./data");

// ─── FACTION CAPITAL MAP ────────────────────────────────────────────────────

const factionById = new Map(factions.map((f) => [f.id, f]));

// ─── SYSTEM TYPE DERIVATION ─────────────────────────────────────────────────

/**
 * Derive structured metadata for a system from its raw fields.
 * @param {object} system - A star system object from systems.json
 * @returns {object} Derived metadata
 */
const deriveSystemMetadata = (system) => {
  const { status, traffic, zoneType, tags = [], factionId, capitalOf } = system;

  // 1. System type
  let systemType;
  if (capitalOf) {
    systemType = "capital";
  } else if (tags.includes("TRADE_HUB") || zoneType === "HUB") {
    systemType = "trade_hub";
  } else if (tags.includes("PIRATE_BASE") || tags.includes("PIRATE_MARKET")) {
    systemType = "pirate_haven";
  } else if (tags.includes("SENSOR_SPIRE") || tags.includes("PSYCHIC_ANOMALY") || zoneType === "STORY_UNIQUE") {
    systemType = "research_outpost";
  } else if (tags.includes("FORGE_WORLD")) {
    systemType = "industrial";
  } else if (tags.includes("TERRAFORMING_SITE") || tags.includes("COLONY_CANDIDATE")) {
    systemType = "agricultural";
  } else if (tags.includes("CONFLICT_ZONE")) {
    systemType = "contested";
  } else if (tags.includes("DEEP_BACKWATER")) {
    systemType = "frontier";
  } else if (status === "core") {
    systemType = "core_world";
  } else if (status === "frontier") {
    systemType = "frontier";
  } else {
    systemType = "core_world";
  }

  // 2. Shipyard tier (0 = none, 1 = basic, 5 = full capital)
  let shipyardTier;
  if (systemType === "capital") {
    shipyardTier = 5;
  } else if (systemType === "trade_hub") {
    shipyardTier = 4;
  } else if (systemType === "industrial") {
    shipyardTier = 4;
  } else if (status === "core" && traffic === "heavy") {
    shipyardTier = 4;
  } else if (status === "core") {
    shipyardTier = 3;
  } else if (systemType === "research_outpost") {
    shipyardTier = 3;
  } else if (systemType === "agricultural") {
    shipyardTier = 2;
  } else if (systemType === "pirate_haven") {
    shipyardTier = 2;
  } else if (status === "border" && traffic === "medium") {
    shipyardTier = 2;
  } else if (systemType === "frontier" || tags.includes("DEEP_BACKWATER")) {
    shipyardTier = 1;
  } else if (systemType === "contested") {
    shipyardTier = 1;
  } else {
    shipyardTier = 1;
  }

  // 3. Tech level (1–5); high-tech factions get a bonus in their own territory
  let techLevel;
  const hiTechFactions = new Set(["luminari_compact", "echotrail_communion"]);
  const isHiTech = factionId && hiTechFactions.has(factionId);
  if (systemType === "capital") {
    techLevel = isHiTech ? 5 : 4;
  } else if (status === "core" && isHiTech) {
    techLevel = 4;
  } else if (status === "core") {
    techLevel = 3;
  } else if (systemType === "research_outpost") {
    techLevel = isHiTech ? 5 : 4;
  } else if (systemType === "industrial") {
    techLevel = 3;
  } else if (status === "border") {
    techLevel = 2;
  } else {
    techLevel = 1;
  }

  // 4. Population level (1–5)
  let populationLevel;
  if (systemType === "capital") {
    populationLevel = 5;
  } else if (traffic === "heavy" && status === "core") {
    populationLevel = 4;
  } else if (traffic === "medium" && (status === "core" || status === "border")) {
    populationLevel = 3;
  } else if (traffic === "light") {
    populationLevel = 2;
  } else if (systemType === "frontier" || tags.includes("DEEP_BACKWATER")) {
    populationLevel = 1;
  } else {
    populationLevel = 2;
  }

  // 5. Industrial output (1–5)
  let industrialOutput;
  if (systemType === "industrial") {
    industrialOutput = 5;
  } else if (systemType === "capital" || systemType === "trade_hub") {
    industrialOutput = 4;
  } else if (status === "core" && traffic === "heavy") {
    industrialOutput = 3;
  } else if (traffic === "medium") {
    industrialOutput = 2;
  } else {
    industrialOutput = 1;
  }

  // 6. Economic level (1–5)
  let economicLevel;
  if (systemType === "trade_hub" || systemType === "capital") {
    economicLevel = 5;
  } else if (status === "core") {
    economicLevel = traffic === "heavy" ? 4 : 3;
  } else if (status === "border") {
    economicLevel = 2;
  } else {
    economicLevel = 1;
  }

  return {
    systemType,
    shipyardTier,
    techLevel,
    populationLevel,
    industrialOutput,
    economicLevel,
  };
};

// ─── FACTION TERRITORY RULES ────────────────────────────────────────────────

/**
 * Returns faction IDs that are allowed to sell ships in the given system.
 * Neutral ships are always allowed wherever there is a shipyard.
 */
const getAllowedFactions = (system, metadata) => {
  const allowed = new Set();

  // Neutral ships available everywhere
  allowed.add("neutral");

  const { systemType } = metadata;
  const { factionId, capitalOf, tags = [] } = system;

  if (!factionId && !capitalOf) {
    // Unclaimed neutral space — only neutral ships
    return allowed;
  }

  // The system's controlling faction
  if (factionId) {
    allowed.add(factionId);
  }
  if (capitalOf) {
    allowed.add(capitalOf);
  }

  // Pirate havens carry Black Flag ships regardless of owner
  if (
    systemType === "pirate_haven" ||
    tags.includes("PIRATE_BASE") ||
    tags.includes("PIRATE_MARKET")
  ) {
    allowed.add("black_flag_syndicate");
  }

  // Trade hubs carry Free Horizons Guild civilian ships
  if (systemType === "trade_hub") {
    allowed.add("free_horizons_guild");
  }

  // Contested border systems may carry ships from disputing factions
  if (tags.includes("CONFLICT_ZONE") && system.disputedWith) {
    for (const disputeFaction of system.disputedWith) {
      allowed.add(disputeFaction);
    }
  }

  return allowed;
};

// ─── SHIP AVAILABILITY ALGORITHM ────────────────────────────────────────────

/**
 * Returns the list of ships available for purchase in the given system.
 *
 * Rules (in order):
 *  1. System must have a shipyard (shipyardTier >= 1) to sell any ships.
 *  2. Tier I (Starter) ships are available in every system with a shipyard,
 *     but only for the controlling faction (or neutral).
 *  3. Higher-tier ships require: shipyardTier >= requiredShipyardLevel,
 *     techLevel >= minTechLevel, populationLevel >= minPopulation.
 *  4. A ship may only be purchased at a system aligned with its faction,
 *     unless it is a neutral ship or the system is a pirate haven / trade hub.
 *  5. Unique/regional ships (preferredSystemTypes) get a bonus: they are
 *     available one shipyard-tier lower than normal in their preferred location.
 *
 * @param {object} system - Star system object from systems.json
 * @returns {{ metadata: object, available: object[] }}
 */
const getShipsForSystem = (system) => {
  const metadata = deriveSystemMetadata(system);
  const { shipyardTier, techLevel, populationLevel } = metadata;

  if (shipyardTier === 0) {
    return { metadata, available: [] };
  }

  const allowedFactions = getAllowedFactions(system, metadata);

  const available = ships.filter((ship) => {
    // Faction gate
    if (!allowedFactions.has(ship.factionId)) {
      return false;
    }

    // Tier I ships are always available where there is any shipyard
    if (ship.tier === "I") {
      return true;
    }

    // Determine effective required shipyard level, applying regional preference bonus
    const inPreferredSystem =
      Array.isArray(ship.preferredSystemTypes) &&
      ship.preferredSystemTypes.includes(metadata.systemType);
    const effectiveShipyardRequired = inPreferredSystem
      ? Math.max(1, (ship.requiredShipyardLevel ?? 1) - 1)
      : (ship.requiredShipyardLevel ?? 1);

    if (shipyardTier < effectiveShipyardRequired) {
      return false;
    }
    if (techLevel < (ship.minTechLevel ?? 1)) {
      return false;
    }
    if (populationLevel < (ship.minPopulation ?? 0)) {
      return false;
    }

    return true;
  });

  return { metadata, available };
};

// ─── CONVENIENCE WRAPPER ────────────────────────────────────────────────────

/**
 * Look up a system by ID and return its available ships.
 * @param {string} systemId
 * @param {Map<string, object>} systemById - Map from world.js
 * @returns {{ metadata: object, available: object[] } | null}
 */
const getShipsForSystemId = (systemId, systemById) => {
  const system = systemById.get(systemId);
  if (!system) {
    return null;
  }
  return getShipsForSystem(system);
};

module.exports = {
  deriveSystemMetadata,
  getAllowedFactions,
  getShipsForSystem,
  getShipsForSystemId,
};
