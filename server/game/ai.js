const { systems, planets, ships } = require("./data");

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
  shuttle: ["shuttle"],
  courier: ["courier", "aurora_clipper"],
  freighter: ["pioneer_hauler", "atlas_bulk", "caravel_super", "nomad_liner"],
  fighter: ["sparrow_mk1", "sparrow_mk2", "vanguard"],
  escort: ["wisp_runner", "bastion_guard", "ironclad"],
  scout: ["ember_skiff"],
  frigate: ["frigate"]
};

const systemShipMix = {
  sol: { shuttle: 3, courier: 4, freighter: 4, escort: 3, fighter: 2, frigate: 1 },
  alpha: { courier: 3, freighter: 2, shuttle: 2, scout: 2, escort: 1 },
  vega: { freighter: 4, courier: 3, shuttle: 2, escort: 2, scout: 1 },
  draco: { fighter: 3, escort: 2, courier: 1, freighter: 1 },
  sirius: { courier: 3, scout: 2, escort: 1, freighter: 1 },
  orion: { freighter: 5, escort: 3, courier: 2, frigate: 1 }
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

const pickShipForSystem = (systemId) => {
  const mix = systemShipMix[systemId] || systemShipMix.sol;
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

const createShipName = (ship, role) => {
  const tag = role.slice(0, 3).toUpperCase();
  const serial = Math.floor(randomRange(100, 999));
  const callsign = ship?.name?.split(" ")[0] ?? "Traffic";
  return `${callsign} ${tag}-${serial}`;
};

const getShipSpeed = (ship) => {
  if (!ship) {
    return 120;
  }
  const base = 140 - ship.hull * 0.15;
  return Math.max(80, Math.min(180, base));
};

const steerShip = (ship, targetX, targetY, deltaSeconds) => {
  const dx = targetX - ship.x;
  const dy = targetY - ship.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1e-2) {
    ship.vx *= 0.9;
    ship.vy *= 0.9;
    return distance;
  }
  const maxSpeed = getShipSpeed(ship.ship);
  const desiredSpeed = Math.min(maxSpeed, distance * 0.6);
  const desiredVx = (dx / distance) * desiredSpeed;
  const desiredVy = (dy / distance) * desiredSpeed;
  const responsiveness = 2.8;
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

const spawnAiShip = (systemId) => {
  const planet = pickPlanetInSystem(systemId);
  const planetPosition = planet ? planetPositions.get(planet.id) : { x: 0, y: 0 };
  const { ship, role } = pickShipForSystem(systemId);
  if (!ship) {
    return null;
  }
  const spawnAngle = Math.random() * Math.PI * 2;
  const spawnDistance = randomRange(520, 760);
  const shipId = `ai-${Math.random().toString(36).slice(2, 9)}`;
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
    ai: {
      state: "approach",
      targetPlanetId: planet?.id ?? null,
      targetX: planetPosition?.x ?? 0,
      targetY: planetPosition?.y ?? 0,
      stateUntil: 0,
      nextWaypointAt: 0
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
    const level = trafficLevels[systemTraffic[system.id] || "light"];
    const targetCount = Math.floor(randomRange(level.min, level.max + 1));
    systemTrafficTargets.set(system.id, {
      targetCount,
      nextRefreshAt: now + randomRange(25000, 48000)
    });
  });
};

const getSystemTarget = (systemId) =>
  systemTrafficTargets.get(systemId)?.targetCount ?? trafficLevels.light.min;

const tickAiShips = (deltaSeconds) => {
  const now = Date.now();
  updateTrafficTargets(now);

  systems.forEach((system) => {
    const currentCount = Array.from(aiShips.values()).filter(
      (ship) => ship.systemId === system.id
    ).length;
    const targetCount = getSystemTarget(system.id);
    const needed = targetCount - currentCount;
    const spawnCount = Math.min(needed, 2);
    for (let i = 0; i < spawnCount; i += 1) {
      spawnAiShip(system.id);
    }
  });

  Array.from(aiShips.values()).forEach((ship) => {
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

    if (ship.ai.state === "exit") {
      const distance = steerShip(ship, ship.ai.targetX, ship.ai.targetY, deltaSeconds);
      if (distance < 32 || now >= ship.ai.stateUntil) {
        aiShips.delete(ship.id);
      }
    }
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
    shield: ship.shield
  }));

module.exports = {
  tickAiShips,
  getAiShipStatus
};
