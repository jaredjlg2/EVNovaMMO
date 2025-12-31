const { systems, planets, ships, factions, goods } = require("./data");

const aiShips = new Map();
const shipById = new Map(ships.map((ship) => [ship.id, ship]));

const planetPositions = new Map();
const buildPlanetPositions = () => {
  planetPositions.clear();
  systems.forEach((system) => {
    const systemPlanets = planets.filter((planet) => planet.systemId === system.id);
    if (systemPlanets.length === 0) {
      return;
    }
    const step = (Math.PI * 2) / systemPlanets.length;
    systemPlanets.forEach((planet, index) => {
      const radius = 220 + (index % 2) * 90;
      const angle = index * step - Math.PI / 2;
      planetPositions.set(planet.id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    });
  });
};

buildPlanetPositions();

const trafficLevels = {
  light: { min: 1, max: 3 },
  medium: { min: 3, max: 6 },
  heavy: { min: 6, max: 9 }
};

const systemTraffic = {
  sol: "heavy",
  alpha: "medium",
  vega: "medium",
  draco: "light",
  sirius: "light",
  orion: "heavy"
};

const shipRoles = {
  shuttle: [
    "sd_passport",
    "kesh_trailwaker",
    "echo_seedling",
    "lu_lantern",
    "fh_patchliner",
    "bf_ratchet",
    "st_sporelight",
    "oc_cinderling",
    "neutral_frontier_skiff"
  ],
  courier: [
    "sd_redoubt",
    "kesh_hearthguard",
    "echo_flowstate",
    "lu_fluxline",
    "fh_wayfinder",
    "bf_ransacker",
    "st_habitat_arc"
  ],
  freighter: [
    "fh_holdmaster",
    "st_eden_hauler",
    "st_greenforge",
    "st_genesis_crown",
    "neutral_common_hauler"
  ],
  fighter: [
    "sd_repulse",
    "kesh_bloodwing",
    "echo_mirage",
    "lu_aetherwing",
    "fh_crosswind",
    "bf_spite",
    "oc_glyphbite"
  ],
  escort: [
    "sd_sentinel",
    "kesh_warlance",
    "fh_breakwater",
    "bf_harbinger",
    "oc_hollow_verse"
  ],
  scout: ["lu_fluxline", "echo_seedling", "fh_wayfinder"],
  frigate: [
    "sd_sentinel",
    "kesh_warlance",
    "echo_wellspring",
    "lu_heliostat",
    "bf_harbinger",
    "oc_hollow_verse"
  ]
};

const factionById = new Map(factions.map((faction) => [faction.id, faction]));

const factionShipMix = {
  free_horizons_guild: {
    shuttle: 3,
    courier: 4,
    freighter: 6,
    escort: 1,
    fighter: 0,
    scout: 2,
    frigate: 0
  },
  solar_directorate: {
    shuttle: 1,
    courier: 3,
    freighter: 2,
    escort: 4,
    fighter: 3,
    scout: 1,
    frigate: 2
  },
  starseed_foundation: {
    shuttle: 2,
    courier: 4,
    freighter: 5,
    escort: 2,
    fighter: 1,
    scout: 1,
    frigate: 1
  },
  ironclad_clans: {
    shuttle: 1,
    courier: 3,
    freighter: 2,
    escort: 3,
    fighter: 3,
    scout: 1,
    frigate: 2
  },
  black_flag_syndicate: {
    shuttle: 0,
    courier: 2,
    freighter: 1,
    escort: 3,
    fighter: 4,
    scout: 2,
    frigate: 1
  },
  luminari_compact: {
    shuttle: 1,
    courier: 3,
    freighter: 2,
    escort: 3,
    fighter: 2,
    scout: 2,
    frigate: 1
  },
  echotrail_communion: {
    shuttle: 2,
    courier: 2,
    freighter: 0,
    escort: 1,
    fighter: 2,
    scout: 3,
    frigate: 1
  },
  obsidian_covenant: {
    shuttle: 1,
    courier: 1,
    freighter: 0,
    escort: 2,
    fighter: 3,
    scout: 1,
    frigate: 2
  }
};

const roleCombatProfile = {
  shuttle: { damage: 4, range: 120 },
  courier: { damage: 6, range: 150 },
  freighter: { damage: 5, range: 140 },
  fighter: { damage: 16, range: 220 },
  escort: { damage: 14, range: 210 },
  scout: { damage: 10, range: 180 },
  frigate: { damage: 24, range: 240 }
};

const systemTrafficTargets = new Map();

const randomRange = (min, max) => min + Math.random() * (max - min);

const pickWeighted = (weights) => {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return key;
    }
  }
  return entries[0]?.[0] ?? "courier";
};

const pickShipForSystem = (system, factionId) => {
  const baseMix = factionShipMix[factionId] || factionShipMix.free_horizons_guild;
  const mix = { ...baseMix };
  if (system.status === "border") {
    mix.fighter = (mix.fighter ?? 0) + 1;
    mix.escort = (mix.escort ?? 0) + 1;
  }
  if (system.status === "frontier") {
    mix.scout = (mix.scout ?? 0) + 1;
    mix.freighter = (mix.freighter ?? 0) + 1;
  }
  if (system.disputedWith && system.disputedWith.length > 0) {
    mix.fighter = (mix.fighter ?? 0) + 2;
    mix.escort = (mix.escort ?? 0) + 2;
    mix.frigate = (mix.frigate ?? 0) + 1;
  }
  const role = pickWeighted(mix);
  const pool = shipRoles[role] || shipRoles.courier;
  const shipId = pool[Math.floor(Math.random() * pool.length)];
  return { ship: shipById.get(shipId), role };
};

const pickPlanetInSystem = (systemId) => {
  const candidates = planets.filter((planet) => planet.systemId === systemId);
  if (candidates.length === 0) {
    return null;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
};

const createShipName = (ship, role, factionId) => {
  const tag = role.slice(0, 3).toUpperCase();
  const serial = Math.floor(randomRange(100, 999));
  const callsign = ship?.name?.split(" ")[0] ?? "Traffic";
  const factionCode = factionById.get(factionId)?.code ?? "CIV";
  return `${callsign} ${factionCode}-${tag}-${serial}`;
};

const getShipSpeed = (ship) => {
  if (!ship) {
    return 120;
  }
  const base = 140 - ship.hull * 0.15;
  return Math.max(80, Math.min(180, base));
};

const steerShip = (ship, targetX, targetY, deltaSeconds, options = {}) => {
  const dx = targetX - ship.x;
  const dy = targetY - ship.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1e-2) {
    ship.vx *= 0.9;
    ship.vy *= 0.9;
    return distance;
  }
  const maxSpeed = options.maxSpeed ?? getShipSpeed(ship.ship);
  const desiredSpeed = Math.min(maxSpeed, distance * 0.6);
  const desiredVx = (dx / distance) * desiredSpeed;
  const desiredVy = (dy / distance) * desiredSpeed;
  const responsiveness = options.responsiveness ?? 2.8;
  const adjust = Math.min(1, responsiveness * deltaSeconds);
  ship.vx += (desiredVx - ship.vx) * adjust;
  ship.vy += (desiredVy - ship.vy) * adjust;
  ship.x += ship.vx * deltaSeconds;
  ship.y += ship.vy * deltaSeconds;
  if (Math.hypot(ship.vx, ship.vy) > 0.5) {
    ship.angle = Math.atan2(ship.vy, ship.vx);
  }
  return distance;
};

const beginDocking = (ship, planetId, now) => {
  const position = planetPositions.get(planetId);
  ship.planetId = planetId;
  ship.x = position?.x ?? 0;
  ship.y = position?.y ?? 0;
  ship.vx = 0;
  ship.vy = 0;
  ship.ai.state = "docked";
  ship.ai.stateUntil = now + randomRange(4000, 12000);
};

const beginDeparture = (ship, now) => {
  const planetPosition = planetPositions.get(ship.ai.targetPlanetId);
  const originX = planetPosition?.x ?? 0;
  const originY = planetPosition?.y ?? 0;
  const angle = Math.random() * Math.PI * 2;
  const distance = randomRange(420, 620);
  ship.planetId = null;
  ship.ai.state = "depart";
  ship.ai.targetX = originX + Math.cos(angle) * distance;
  ship.ai.targetY = originY + Math.sin(angle) * distance;
  ship.ai.stateUntil = now + randomRange(8000, 16000);
};

const setLoiterTarget = (ship, now) => {
  const angle = Math.random() * Math.PI * 2;
  const radius = randomRange(280, 560);
  ship.ai.targetX = Math.cos(angle) * radius;
  ship.ai.targetY = Math.sin(angle) * radius;
  ship.ai.nextWaypointAt = now + randomRange(4000, 9000);
};

const beginExit = (ship, now) => {
  const angle = Math.random() * Math.PI * 2;
  const radius = randomRange(900, 1200);
  ship.ai.state = "exit";
  ship.ai.targetX = Math.cos(angle) * radius;
  ship.ai.targetY = Math.sin(angle) * radius;
  ship.ai.stateUntil = now + randomRange(8000, 14000);
};

const getSystemFactionWeights = (system) => {
  const weights = {};
  if (system.factionId) {
    weights[system.factionId] = system.status === "core" ? 6 : 4;
  }
  (system.disputedWith || []).forEach((factionId) => {
    weights[factionId] = (weights[factionId] ?? 0) + 3;
  });
  weights.free_horizons_guild = system.status === "border" ? 3 : 4;
  return weights;
};

const pickFactionForSystem = (system) => pickWeighted(getSystemFactionWeights(system));

const spawnAiShip = (systemId) => {
  const system = systems.find((entry) => entry.id === systemId);
  if (!system) {
    return null;
  }
  const planet = pickPlanetInSystem(systemId);
  const planetPosition = planet ? planetPositions.get(planet.id) : { x: 0, y: 0 };
  const factionId = pickFactionForSystem(system);
  const { ship, role } = pickShipForSystem(system, factionId);
  if (!ship) {
    return null;
  }
  const spawnAngle = Math.random() * Math.PI * 2;
  const spawnDistance = randomRange(520, 760);
  const shipId = `ai-${Math.random().toString(36).slice(2, 9)}`;
  const cargo = randomCargoManifest(ship.cargo);
  const newShip = {
    id: shipId,
    name: createShipName(ship, role),
    systemId,
    planetId: null,
    x: (planetPosition?.x ?? 0) + Math.cos(spawnAngle) * spawnDistance,
    y: (planetPosition?.y ?? 0) + Math.sin(spawnAngle) * spawnDistance,
    vx: 0,
    vy: 0,
    angle: spawnAngle,
    ship,
    hull: ship.hull,
    shield: ship.shield,
    factionId,
    cargo,
    credits: getAiCredits(ship, role, cargo),
    ai: {
      state: "approach",
      role,
      targetPlanetId: planet?.id ?? null,
      targetX: planetPosition?.x ?? 0,
      targetY: planetPosition?.y ?? 0,
      stateUntil: 0,
      nextWaypointAt: 0,
      lastAttackAt: 0,
      hostileTo: new Set(),
      disabled: false,
      ownerId: null,
      escortMode: "follow",
      escortTargetId: null,
      formationIndex: 0,
      holdX: null,
      holdY: null,
      hired: false,
      dailyRate: 0,
      bounty: getAiBounty(role, system, factionId)
    }
  };
  aiShips.set(shipId, newShip);
  return newShip;
};

const updateTrafficTargets = (now) => {
  systems.forEach((system) => {
    const record = systemTrafficTargets.get(system.id);
    if (record && record.nextRefreshAt > now) {
      return;
    }
    const level = trafficLevels[system.traffic || "light"];
    const targetCount = Math.floor(randomRange(level.min, level.max + 1));
    systemTrafficTargets.set(system.id, {
      targetCount,
      nextRefreshAt: now + randomRange(25000, 48000)
    });
  });
};

const getSystemTarget = (systemId) =>
  systemTrafficTargets.get(systemId)?.targetCount ?? trafficLevels.light.min;

const disableThresholds = {
  minHull: 2,
  maxHull: 30
};

const getCargoValue = (cargo) =>
  (cargo || []).reduce((total, entry) => {
    const good = goods.find((item) => item.id === entry.goodId);
    return total + (good?.basePrice ?? 0) * entry.quantity;
  }, 0);

const getAiCredits = (ship, role, cargo) => {
  const cargoValue = getCargoValue(cargo);
  const base = {
    freighter: 260000,
    escort: 200000,
    frigate: 320000,
    fighter: 160000,
    courier: 120000,
    scout: 100000,
    shuttle: 80000
  }[role] ?? 90000;
  const priceFactor = (ship?.price ?? 0) * 2.5;
  const cargoFactor = cargoValue * 0.2;
  const variance = randomRange(20000, 120000);
  return Math.floor(base + priceFactor + cargoFactor + variance);
};

const getAiBounty = (role, system, factionId) => {
  const baseRange = {
    shuttle: [20000, 26000],
    courier: [22000, 28000],
    scout: [20000, 26000],
    fighter: [45000, 90000],
    escort: [55000, 105000],
    freighter: [90000, 135000],
    frigate: [95000, 135000]
  }[role] || [30000, 60000];
  const statusBonus = system?.status === "border" ? 1.15 : system?.status === "frontier" ? 1.25 : 1;
  const pirateBonus = factionId === "black_flag_syndicate" ? 1.2 : 1;
  return Math.round(randomRange(baseRange[0], baseRange[1]) * statusBonus * pirateBonus);
};

const randomCargoManifest = (cargoCapacity) => {
  if (!cargoCapacity || goods.length === 0) {
    return [];
  }
  const selectionCount = Math.max(1, Math.min(3, Math.floor(Math.random() * 3) + 1));
  const targetLoad = Math.max(1, Math.round(randomRange(cargoCapacity * 0.55, cargoCapacity * 0.95)));
  let remaining = targetLoad;
  const manifest = [];
  const chosen = new Set();
  for (let i = 0; i < selectionCount && remaining > 0; i += 1) {
    const good = goods[Math.floor(Math.random() * goods.length)];
    if (!good || chosen.has(good.id)) {
      continue;
    }
    chosen.add(good.id);
    const maxForSlot = Math.max(1, remaining - (selectionCount - i - 1));
    const quantity = Math.min(
      remaining,
      Math.max(1, Math.round(randomRange(1, maxForSlot)))
    );
    remaining -= quantity;
    manifest.push({ goodId: good.id, quantity });
  }
  return manifest;
};

const applyDamage = (ship, damage) => {
  const shieldDamage = Math.min(ship.shield, damage);
  ship.shield = Math.max(0, ship.shield - shieldDamage);
  const remaining = damage - shieldDamage;
  if (remaining > 0) {
    ship.hull = Math.max(0, ship.hull - remaining);
  }
  updateDisabledStatus(ship);
};

const markShipHostileToPlayer = (shipId, playerId) => {
  const ship = aiShips.get(shipId);
  if (!ship || !playerId) {
    return null;
  }
  if (!ship.ai.hostileTo) {
    ship.ai.hostileTo = new Set();
  }
  ship.ai.hostileTo.add(playerId);
  return ship;
};

const updateDisabledStatus = (ship) => {
  if (!ship?.ai) {
    return;
  }
  if (ship.hull <= 0) {
    ship.ai.disabled = false;
    return;
  }
  const disabledNow =
    ship.shield <= 0 &&
    ship.hull < disableThresholds.maxHull &&
    ship.hull > disableThresholds.minHull;
  if (disabledNow) {
    ship.ai.disabled = true;
  }
};

const getAiShips = () => Array.from(aiShips.values());

const getAiShipById = (shipId) => aiShips.get(shipId);

const createEscortShip = ({
  ship,
  systemId,
  x,
  y,
  ownerId,
  name,
  role,
  formationIndex = 0,
  hired = true,
  dailyRate = 0
}) => {
  if (!ship || !systemId || !ownerId) {
    return null;
  }
  const shipId = `escort-${Math.random().toString(36).slice(2, 9)}`;
  const newShip = {
    id: shipId,
    name: name || ship.name,
    systemId,
    planetId: null,
    x: typeof x === "number" ? x : 0,
    y: typeof y === "number" ? y : 0,
    vx: 0,
    vy: 0,
    angle: Math.random() * Math.PI * 2,
    ship,
    hull: ship.hull,
    shield: ship.shield,
    factionId: null,
    cargo: [],
    credits: 0,
    ai: {
      state: "escort",
      role: role || "escort",
      targetPlanetId: null,
      targetX: 0,
      targetY: 0,
      stateUntil: 0,
      nextWaypointAt: 0,
      lastAttackAt: 0,
      hostileTo: new Set(),
      disabled: false,
      ownerId,
      escortMode: "follow",
      escortTargetId: null,
      formationIndex,
      holdX: null,
      holdY: null,
      hired,
      dailyRate
    }
  };
  aiShips.set(shipId, newShip);
  return newShip;
};

const assignShipAsEscort = (
  ship,
  ownerId,
  { formationIndex = 0, hired = false, dailyRate = 0 } = {}
) => {
  if (!ship || !ship.ai) {
    return null;
  }
  ship.ai.ownerId = ownerId;
  ship.ai.escortMode = "follow";
  ship.ai.escortTargetId = null;
  ship.ai.formationIndex = formationIndex;
  ship.ai.holdX = null;
  ship.ai.holdY = null;
  ship.ai.hired = hired;
  ship.ai.dailyRate = dailyRate;
  ship.ai.hostileTo = new Set();
  ship.ai.disabled = false;
  return ship;
};

const removeAiShip = (shipId) => {
  const ship = aiShips.get(shipId);
  aiShips.delete(shipId);
  return ship || null;
};

const getRoleCombatProfile = (role) =>
  roleCombatProfile[role] || roleCombatProfile.courier;

const isHostile = (system, ship, other) => {
  if (!ship.factionId || !other.factionId) {
    return false;
  }
  if (ship.factionId === "free_horizons_guild" || other.factionId === "free_horizons_guild") {
    return false;
  }
  if (ship.factionId === other.factionId) {
    return false;
  }
  const contested = new Set([system.factionId, ...(system.disputedWith || [])]);
  return contested.has(ship.factionId) && contested.has(other.factionId);
};

const findHostileTarget = (system, ship, candidates) => {
  const roleProfile = roleCombatProfile[ship.ai.role] || roleCombatProfile.courier;
  let closest = null;
  let closestDistance = Infinity;
  candidates.forEach((other) => {
    if (other.id === ship.id || !isHostile(system, ship, other)) {
      return;
    }
    const distance = Math.hypot(ship.x - other.x, ship.y - other.y);
    if (distance <= roleProfile.range && distance < closestDistance) {
      closest = other;
      closestDistance = distance;
    }
  });
  return closest;
};

const tickAiShips = (deltaSeconds, players = []) => {
  const now = Date.now();
  updateTrafficTargets(now);
  const playersById = new Map(players.map((player) => [player.id, player]));

  systems.forEach((system) => {
    const currentCount = Array.from(aiShips.values()).filter(
      (ship) => ship.systemId === system.id && !ship.ai.ownerId
    ).length;
    const targetCount = getSystemTarget(system.id);
    const needed = targetCount - currentCount;
    const spawnCount = Math.min(needed, 2);
    for (let i = 0; i < spawnCount; i += 1) {
      spawnAiShip(system.id);
    }
  });

  Array.from(aiShips.values()).forEach((ship) => {
    if (ship.ai.ownerId) {
      const owner = playersById.get(ship.ai.ownerId);
      if (!owner) {
        aiShips.delete(ship.id);
        return;
      }
      if (ship.ai.disabled) {
        ship.vx = 0;
        ship.vy = 0;
        return;
      }
      if (owner.systemId !== ship.systemId || owner.planetId) {
        ship.vx *= 0.9;
        ship.vy *= 0.9;
        return;
      }
      const formationIndex = ship.ai.formationIndex ?? 0;
      const wingIndex = Math.floor((formationIndex + 1) / 2);
      const wingSide =
        formationIndex === 0 ? 0 : formationIndex % 2 === 1 ? -1 : 1;
      const backAngle = owner.angle + Math.PI;
      const lateralAngle = backAngle + Math.PI / 2;
      const backSpacing = 52;
      const rowSpacing = 24;
      const lateralSpacing = 30;
      const backDistance =
        formationIndex === 0 ? backSpacing : backSpacing + (wingIndex - 1) * rowSpacing;
      const lateralOffset =
        wingSide === 0 ? 0 : wingSide * lateralSpacing * Math.max(1, wingIndex);
      const formationX =
        owner.x +
        Math.cos(backAngle) * backDistance +
        Math.cos(lateralAngle) * lateralOffset;
      const formationY =
        owner.y +
        Math.sin(backAngle) * backDistance +
        Math.sin(lateralAngle) * lateralOffset;
      if (ship.ai.escortMode === "hold") {
        if (ship.ai.holdX == null || ship.ai.holdY == null) {
          ship.ai.holdX = ship.x;
          ship.ai.holdY = ship.y;
        }
        steerShip(ship, ship.ai.holdX, ship.ai.holdY, deltaSeconds);
        return;
      }
      if (ship.ai.escortMode === "attack" && ship.ai.escortTargetId) {
        const target =
          playersById.get(ship.ai.escortTargetId) || aiShips.get(ship.ai.escortTargetId);
        if (target && target.systemId === ship.systemId && !target.planetId) {
          steerShip(ship, target.x, target.y, deltaSeconds);
          return;
        }
        ship.ai.escortMode = "follow";
        ship.ai.escortTargetId = null;
      }
      const ownerSpeed = getShipSpeed(owner.ship);
      const formationDistance = Math.hypot(formationX - ship.x, formationY - ship.y);
      const escortMaxSpeed =
        Math.max(ownerSpeed + 80, 240) + Math.min(200, Math.max(0, formationDistance - 60) * 1.5);
      const escortResponsiveness = 4 + Math.min(4, formationDistance / 60);
      steerShip(ship, formationX, formationY, deltaSeconds, {
        maxSpeed: escortMaxSpeed,
        responsiveness: escortResponsiveness
      });
      return;
    }

    if (ship.ai.disabled) {
      ship.vx = 0;
      ship.vy = 0;
      return;
    }

    const planetPosition = ship.ai.targetPlanetId
      ? planetPositions.get(ship.ai.targetPlanetId)
      : null;

    if (ship.ai.state === "docked") {
      if (now >= ship.ai.stateUntil) {
        beginDeparture(ship, now);
      }
      return;
    }

    if (ship.ai.state === "approach") {
      if (planetPosition) {
        ship.ai.targetX = planetPosition.x;
        ship.ai.targetY = planetPosition.y;
      }
      const distance = steerShip(ship, ship.ai.targetX, ship.ai.targetY, deltaSeconds);
      if (distance < 36 && ship.ai.targetPlanetId) {
        beginDocking(ship, ship.ai.targetPlanetId, now);
      }
      return;
    }

    if (ship.ai.state === "depart") {
      const distance = steerShip(ship, ship.ai.targetX, ship.ai.targetY, deltaSeconds);
      if (distance < 24 || now >= ship.ai.stateUntil) {
        ship.ai.state = "loiter";
        ship.ai.stateUntil = now + randomRange(10000, 20000);
        setLoiterTarget(ship, now);
      }
      return;
    }

    if (ship.ai.state === "loiter") {
      if (now >= ship.ai.stateUntil) {
        beginExit(ship, now);
        return;
      }
      if (now >= ship.ai.nextWaypointAt) {
        setLoiterTarget(ship, now);
      }
      steerShip(ship, ship.ai.targetX, ship.ai.targetY, deltaSeconds);
      return;
    }

    if (ship.ai.state === "engage") {
      const distance = steerShip(ship, ship.ai.targetX, ship.ai.targetY, deltaSeconds);
      if (distance < 40 || now >= ship.ai.stateUntil) {
        ship.ai.state = "loiter";
        ship.ai.stateUntil = now + randomRange(8000, 16000);
        setLoiterTarget(ship, now);
      }
      return;
    }

    if (ship.ai.state === "exit") {
      const distance = steerShip(ship, ship.ai.targetX, ship.ai.targetY, deltaSeconds);
      if (distance < 32 || now >= ship.ai.stateUntil) {
        aiShips.delete(ship.id);
      }
    }
  });

  const shipsBySystem = new Map();
  Array.from(aiShips.values()).forEach((ship) => {
    if (ship.ai.ownerId || ship.ai.disabled) {
      return;
    }
    if (!shipsBySystem.has(ship.systemId)) {
      shipsBySystem.set(ship.systemId, []);
    }
    shipsBySystem.get(ship.systemId).push(ship);
  });

  shipsBySystem.forEach((shipsInSystem, systemId) => {
    const system = systems.find((entry) => entry.id === systemId);
    if (!system || !system.disputedWith || system.disputedWith.length === 0) {
      return;
    }
    shipsInSystem.forEach((ship) => {
      if (now - ship.ai.lastAttackAt < 1200) {
        return;
      }
      const target = findHostileTarget(system, ship, shipsInSystem);
      if (!target) {
        return;
      }
      const roleProfile = roleCombatProfile[ship.ai.role] || roleCombatProfile.courier;
      const damage = Math.round(
        roleProfile.damage * (0.7 + Math.random() * 0.6)
      );
      applyDamage(target, damage);
      ship.ai.lastAttackAt = now;
      ship.ai.state = "engage";
      ship.ai.stateUntil = now + randomRange(3000, 6000);
      ship.ai.targetX = target.x;
      ship.ai.targetY = target.y;
      if (target.hull <= 0) {
        aiShips.delete(target.id);
      }
    });
  });
};

const getAiShipStatus = () =>
  Array.from(aiShips.values()).map((ship) => ({
    id: ship.id,
    name: ship.name,
    systemId: ship.systemId,
    planetId: ship.planetId,
    ship: ship.ship,
    x: ship.x,
    y: ship.y,
    angle: ship.angle,
    hull: ship.hull,
    shield: ship.shield,
    factionId: ship.factionId,
    isAi: true,
    hostileTo: Array.from(ship.ai.hostileTo || []),
    disabled: Boolean(ship.ai.disabled),
    escortOwnerId: ship.ai.ownerId || null,
    escortMode: ship.ai.escortMode || null
  }));

module.exports = {
  tickAiShips,
  getAiShipStatus,
  getAiShips,
  getAiShipById,
  markShipHostileToPlayer,
  removeAiShip,
  getRoleCombatProfile,
  updateDisabledStatus,
  createEscortShip,
  assignShipAsEscort,
  disableThresholds
};
