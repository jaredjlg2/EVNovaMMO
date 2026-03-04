/**
 * Tests for the ship availability system (shipAvailability.js).
 *
 * Validates:
 *  - System metadata derivation
 *  - Ship availability rules by shipyard tier
 *  - Faction territory enforcement
 *  - Starter ship universal availability
 *  - Capital ship restriction to faction capitals
 *  - Pirate haven / trade hub special rules
 *  - Regional preference bonus
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  deriveSystemMetadata,
  getAllowedFactions,
  getShipsForSystem,
} = require("../server/game/shipAvailability");

const { getShipsForSystem: worldGetShips } = require("../server/game/world");

// ─── FIXTURES ────────────────────────────────────────────────────────────────

const makeSys = (overrides = {}) => ({
  id: "test_sys",
  name: "Test System",
  x: 0,
  y: 0,
  links: [],
  factionId: "solar_directorate",
  status: "core",
  traffic: "heavy",
  zoneType: "CORE",
  tags: [],
  storyHooks: [],
  ...overrides,
});

// ─── deriveSystemMetadata ────────────────────────────────────────────────────

test("deriveSystemMetadata: capitalOf → systemType=capital, shipyardTier=5", () => {
  const meta = deriveSystemMetadata(
    makeSys({ capitalOf: "solar_directorate" })
  );
  assert.equal(meta.systemType, "capital");
  assert.equal(meta.shipyardTier, 5);
  assert.ok(meta.populationLevel >= 4);
});

test("deriveSystemMetadata: TRADE_HUB tag → systemType=trade_hub, shipyardTier=4", () => {
  const meta = deriveSystemMetadata(
    makeSys({ tags: ["TRADE_HUB"], zoneType: "HUB", factionId: "free_horizons_guild" })
  );
  assert.equal(meta.systemType, "trade_hub");
  assert.equal(meta.shipyardTier, 4);
});

test("deriveSystemMetadata: PIRATE_BASE tag → systemType=pirate_haven", () => {
  const meta = deriveSystemMetadata(
    makeSys({ status: "frontier", zoneType: "NEUTRAL_WILD", tags: ["PIRATE_BASE"], factionId: "black_flag_syndicate" })
  );
  assert.equal(meta.systemType, "pirate_haven");
});

test("deriveSystemMetadata: FORGE_WORLD tag → systemType=industrial", () => {
  const meta = deriveSystemMetadata(
    makeSys({ tags: ["FORGE_WORLD"], factionId: "ironclad_clans" })
  );
  assert.equal(meta.systemType, "industrial");
  assert.equal(meta.shipyardTier, 4);
});

test("deriveSystemMetadata: TERRAFORMING_SITE tag → systemType=agricultural", () => {
  const meta = deriveSystemMetadata(
    makeSys({ status: "border", zoneType: "BORDER", tags: ["TERRAFORMING_SITE"], factionId: "starseed_foundation" })
  );
  assert.equal(meta.systemType, "agricultural");
});

test("deriveSystemMetadata: PSYCHIC_ANOMALY/STORY_UNIQUE → systemType=research_outpost", () => {
  const meta = deriveSystemMetadata(
    makeSys({ status: "frontier", zoneType: "STORY_UNIQUE", tags: ["PSYCHIC_ANOMALY"], factionId: "echotrail_communion" })
  );
  assert.equal(meta.systemType, "research_outpost");
});

test("deriveSystemMetadata: DEEP_BACKWATER → systemType=frontier, shipyardTier=1", () => {
  const meta = deriveSystemMetadata(
    makeSys({ status: "frontier", zoneType: "NEUTRAL_WILD", tags: ["DEEP_BACKWATER"], factionId: null })
  );
  assert.equal(meta.systemType, "frontier");
  assert.equal(meta.shipyardTier, 1);
});

test("deriveSystemMetadata: CONFLICT_ZONE tag → systemType=contested", () => {
  const meta = deriveSystemMetadata(
    makeSys({ status: "border", zoneType: "CONFLICT", tags: ["CONFLICT_ZONE"] })
  );
  assert.equal(meta.systemType, "contested");
});

test("deriveSystemMetadata: luminari system gets elevated techLevel", () => {
  const hiTech = deriveSystemMetadata(
    makeSys({ factionId: "luminari_compact", capitalOf: "luminari_compact" })
  );
  const regular = deriveSystemMetadata(
    makeSys({ capitalOf: "solar_directorate", factionId: "solar_directorate" })
  );
  assert.ok(hiTech.techLevel >= regular.techLevel);
});

test("deriveSystemMetadata returns all required metadata fields", () => {
  const meta = deriveSystemMetadata(makeSys());
  assert.ok(typeof meta.systemType === "string");
  assert.ok(typeof meta.shipyardTier === "number");
  assert.ok(typeof meta.techLevel === "number");
  assert.ok(typeof meta.populationLevel === "number");
  assert.ok(typeof meta.industrialOutput === "number");
  assert.ok(typeof meta.economicLevel === "number");
});

// ─── getAllowedFactions ───────────────────────────────────────────────────────

test("getAllowedFactions: always includes neutral", () => {
  const sys = makeSys();
  const meta = deriveSystemMetadata(sys);
  const allowed = getAllowedFactions(sys, meta);
  assert.ok(allowed.has("neutral"));
});

test("getAllowedFactions: includes controlling faction", () => {
  const sys = makeSys({ factionId: "ironclad_clans" });
  const meta = deriveSystemMetadata(sys);
  const allowed = getAllowedFactions(sys, meta);
  assert.ok(allowed.has("ironclad_clans"));
});

test("getAllowedFactions: pirate haven adds black_flag_syndicate", () => {
  const sys = makeSys({
    status: "frontier",
    zoneType: "NEUTRAL_WILD",
    tags: ["PIRATE_BASE"],
    factionId: "ironclad_clans",
  });
  const meta = deriveSystemMetadata(sys);
  const allowed = getAllowedFactions(sys, meta);
  assert.ok(allowed.has("black_flag_syndicate"));
});

test("getAllowedFactions: trade hub adds free_horizons_guild", () => {
  const sys = makeSys({
    tags: ["TRADE_HUB"],
    zoneType: "HUB",
    factionId: "solar_directorate",
  });
  const meta = deriveSystemMetadata(sys);
  const allowed = getAllowedFactions(sys, meta);
  assert.ok(allowed.has("free_horizons_guild"));
});

test("getAllowedFactions: unclaimed system has only neutral", () => {
  const sys = makeSys({ factionId: null, capitalOf: undefined });
  const meta = deriveSystemMetadata(sys);
  const allowed = getAllowedFactions(sys, meta);
  assert.equal(allowed.size, 1);
  assert.ok(allowed.has("neutral"));
});

// ─── getShipsForSystem ────────────────────────────────────────────────────────

test("getShipsForSystem: capital system returns metadata and non-empty ship list", () => {
  const sys = makeSys({ capitalOf: "solar_directorate" });
  const { metadata, available } = getShipsForSystem(sys);
  assert.equal(metadata.systemType, "capital");
  assert.ok(available.length > 0, "Capital should have ships available");
});

test("getShipsForSystem: capital includes Tier I starter ships", () => {
  const sys = makeSys({ capitalOf: "solar_directorate" });
  const { available } = getShipsForSystem(sys);
  const tierOne = available.filter((s) => s.tier === "I");
  assert.ok(tierOne.length > 0, "Tier I ships must be available in capital");
});

test("getShipsForSystem: capital includes high-tier ships (tier V / V+)", () => {
  const sys = makeSys({ capitalOf: "solar_directorate" });
  const { available } = getShipsForSystem(sys);
  const capital = available.filter((s) => s.tier === "V" || s.tier === "V+");
  assert.ok(capital.length > 0, "Capital-tier ships must be available in faction capital");
});

test("getShipsForSystem: frontier system only returns low-tier ships", () => {
  const sys = makeSys({
    status: "frontier",
    zoneType: "NEUTRAL_WILD",
    tags: ["DEEP_BACKWATER"],
    factionId: "solar_directorate",
    traffic: "light",
  });
  const { available } = getShipsForSystem(sys);
  const highTier = available.filter(
    (s) => s.tier === "IV" || s.tier === "V" || s.tier === "V+"
  );
  assert.equal(highTier.length, 0, "No high-tier ships should be available in deep frontier");
});

test("getShipsForSystem: Tier I ships available in frontier", () => {
  const sys = makeSys({
    status: "frontier",
    zoneType: "NEUTRAL_WILD",
    tags: ["DEEP_BACKWATER"],
    factionId: "solar_directorate",
    traffic: "light",
  });
  const { available } = getShipsForSystem(sys);
  const tierOne = available.filter((s) => s.tier === "I");
  assert.ok(tierOne.length > 0, "Tier I ships must be available even in frontier");
});

test("getShipsForSystem: pirate haven includes black flag ships", () => {
  const sys = makeSys({
    status: "frontier",
    zoneType: "NEUTRAL_WILD",
    tags: ["PIRATE_BASE", "PIRATE_MARKET"],
    factionId: "black_flag_syndicate",
    traffic: "medium",
  });
  const { available } = getShipsForSystem(sys);
  const pirate = available.filter((s) => s.factionId === "black_flag_syndicate");
  assert.ok(pirate.length > 0, "Pirate ships must be available in pirate havens");
});

test("getShipsForSystem: enemy faction ships not available in rival territory", () => {
  const sys = makeSys({
    factionId: "solar_directorate",
    capitalOf: "solar_directorate",
  });
  const { available } = getShipsForSystem(sys);
  const ironclad = available.filter(
    (s) => s.factionId === "ironclad_clans"
  );
  assert.equal(ironclad.length, 0, "Ironclad ships should not appear in SD capital");
});

test("getShipsForSystem: neutral ships available in any faction system", () => {
  const sdSys = makeSys({ factionId: "solar_directorate", capitalOf: "solar_directorate" });
  const icSys = makeSys({ factionId: "ironclad_clans", capitalOf: "ironclad_clans" });

  const { available: sdAvail } = getShipsForSystem(sdSys);
  const { available: icAvail } = getShipsForSystem(icSys);

  const sdNeutral = sdAvail.filter((s) => s.factionId === "neutral");
  const icNeutral = icAvail.filter((s) => s.factionId === "neutral");

  assert.ok(sdNeutral.length > 0, "Neutral ships must appear in SD capital");
  assert.ok(icNeutral.length > 0, "Neutral ships must appear in IC capital");
});

test("getShipsForSystem: capital has more ships than frontier", () => {
  const capital = makeSys({ capitalOf: "solar_directorate" });
  const frontier = makeSys({
    status: "frontier",
    zoneType: "NEUTRAL_WILD",
    tags: ["DEEP_BACKWATER"],
    factionId: "solar_directorate",
    traffic: "light",
  });
  const { available: capShips } = getShipsForSystem(capital);
  const { available: frontShips } = getShipsForSystem(frontier);
  assert.ok(capShips.length > frontShips.length, "Capital should offer more ships than frontier");
});

test("getShipsForSystem: all returned ships have required metadata fields", () => {
  const sys = makeSys({ capitalOf: "solar_directorate" });
  const { available } = getShipsForSystem(sys);
  for (const ship of available) {
    assert.ok(ship.id, `Ship missing id`);
    assert.ok(ship.factionId, `Ship ${ship.id} missing factionId`);
    assert.ok(ship.tier, `Ship ${ship.id} missing tier`);
    assert.ok(ship.archetype, `Ship ${ship.id} missing archetype`);
    assert.ok(typeof ship.requiredShipyardLevel === "number", `Ship ${ship.id} missing requiredShipyardLevel`);
  }
});

// ─── world.js integration ─────────────────────────────────────────────────────

test("world.getShipsForSystem: returns ships for known system id 'sol'", () => {
  const result = worldGetShips("sol");
  assert.ok(result, "sol system should return a result");
  assert.ok(result.available.length > 0, "sol should have ships");
});

test("world.getShipsForSystem: returns null for unknown system id", () => {
  const result = worldGetShips("nonexistent_system_xyz");
  assert.equal(result, null);
});

test("world.getShipsForSystem: sol is SD capital with high shipyard tier", () => {
  const result = worldGetShips("sol");
  assert.equal(result.metadata.systemType, "capital");
  assert.equal(result.metadata.shipyardTier, 5);
});

test("world.getShipsForSystem: all 8 faction capitals have shipyardTier 5", () => {
  const capitalIds = ["sol", "auriga", "scar", "sirius", "arcadia", "orion", "st_01", "obsidian"];
  for (const id of capitalIds) {
    const result = worldGetShips(id);
    assert.ok(result, `${id} should return a result`);
    assert.equal(result.metadata.shipyardTier, 5, `${id} should have shipyardTier 5`);
    assert.equal(result.metadata.systemType, "capital", `${id} should be systemType capital`);
  }
});

// ─── SHIP DATA INTEGRITY ──────────────────────────────────────────────────────

test("ships: all ships have archetype field", () => {
  const data = require("../server/game/data");
  for (const ship of data.ships) {
    assert.ok(
      typeof ship.archetype === "string" && ship.archetype.length > 0,
      `Ship ${ship.id} is missing archetype field`
    );
  }
});

test("ships: all ships have requiredShipyardLevel between 1 and 5", () => {
  const data = require("../server/game/data");
  for (const ship of data.ships) {
    assert.ok(
      typeof ship.requiredShipyardLevel === "number" &&
        ship.requiredShipyardLevel >= 1 &&
        ship.requiredShipyardLevel <= 5,
      `Ship ${ship.id} has invalid requiredShipyardLevel`
    );
  }
});

test("ships: each main faction has at least 11 ships", () => {
  const data = require("../server/game/data");
  const mainFactions = [
    "solar_directorate",
    "ironclad_clans",
    "echotrail_communion",
    "luminari_compact",
    "free_horizons_guild",
    "black_flag_syndicate",
    "starseed_foundation",
    "obsidian_covenant",
  ];
  const counts = {};
  for (const ship of data.ships) {
    counts[ship.factionId] = (counts[ship.factionId] ?? 0) + 1;
  }
  for (const factionId of mainFactions) {
    assert.ok(
      (counts[factionId] ?? 0) >= 11,
      `${factionId} has only ${counts[factionId] ?? 0} ships (need >= 11)`
    );
  }
});

test("ships: starter ships (tier I) have requiredShipyardLevel 1", () => {
  const data = require("../server/game/data");
  const starters = data.ships.filter((s) => s.tier === "I");
  for (const ship of starters) {
    assert.equal(
      ship.requiredShipyardLevel,
      1,
      `Tier I ship ${ship.id} should have requiredShipyardLevel 1`
    );
  }
});

test("ships: capital ships (tier V and V+) have requiredShipyardLevel 5", () => {
  const data = require("../server/game/data");
  const capitals = data.ships.filter((s) => s.tier === "V" || s.tier === "V+");
  for (const ship of capitals) {
    assert.equal(
      ship.requiredShipyardLevel,
      5,
      `Capital-tier ship ${ship.id} should have requiredShipyardLevel 5`
    );
  }
});

test("systems: all 8 faction capitals have capitalOf field", () => {
  const data = require("../server/game/data");
  const factionCapitals = {
    sol: "solar_directorate",
    auriga: "ironclad_clans",
    scar: "echotrail_communion",
    sirius: "luminari_compact",
    arcadia: "free_horizons_guild",
    orion: "black_flag_syndicate",
    st_01: "starseed_foundation",
    obsidian: "obsidian_covenant",
  };
  for (const [systemId, factionId] of Object.entries(factionCapitals)) {
    const system = data.systems.find((s) => s.id === systemId);
    assert.ok(system, `Capital system ${systemId} not found`);
    assert.equal(
      system.capitalOf,
      factionId,
      `System ${systemId} should have capitalOf=${factionId}`
    );
  }
});
