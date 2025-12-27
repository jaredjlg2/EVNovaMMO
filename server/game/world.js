const {
  systems,
  planets,
  ships,
  weapons,
  outfits,
  missions,
  missionTemplates,
  goods,
  markets,
  factions
} = require("./data");

const systemById = new Map(systems.map((system) => [system.id, system]));
const planetById = new Map(planets.map((planet) => [planet.id, planet]));

const initialWorld = {
  systems,
  planets,
  ships,
  weapons,
  outfits,
  missions,
  goods,
  markets,
  factions
};

const marketLevels = {
  low: 0.7,
  medium: 1,
  high: 1.4
};

const missionRotationMinutes = 20;
const missionCount = 5;

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const seededRandom = (seed) => {
  let t = seed + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let result = Math.imul(t ^ (t >>> 15), 1 | t);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const canJump = (fromSystemId, toSystemId) => {
  const fromSystem = systemById.get(fromSystemId);
  if (!fromSystem) {
    return false;
  }
  return fromSystem.links.includes(toSystemId);
};

const getPlanetsInSystem = (systemId) =>
  planets.filter((planet) => planet.systemId === systemId);

const getSystemDistance = (fromSystemId, toSystemId) => {
  if (fromSystemId === toSystemId) {
    return 0;
  }
  const visited = new Set([fromSystemId]);
  const queue = [{ id: fromSystemId, depth: 0 }];
  while (queue.length > 0) {
    const current = queue.shift();
    const system = systemById.get(current.id);
    if (!system) {
      continue;
    }
    for (const link of system.links) {
      if (visited.has(link)) {
        continue;
      }
      if (link === toSystemId) {
        return current.depth + 1;
      }
      visited.add(link);
      queue.push({ id: link, depth: current.depth + 1 });
    }
  }
  return 3;
};

const getMarketForPlanet = (planetId) => {
  const market = markets[planetId] || {};
  return goods.map((good) => {
    const level = market[good.id] || "medium";
    const multiplier = marketLevels[level] ?? 1;
    return {
      id: good.id,
      name: good.name,
      basePrice: good.basePrice,
      level,
      price: Math.round(good.basePrice * multiplier),
      volume: 1
    };
  });
};

const formatMissionDescription = (template, origin, destination) =>
  template.description
    .replace("{origin}", origin?.name ?? "Unknown")
    .replace("{destination}", destination?.name ?? "Unknown")
    .replace("{cargo}", template.cargo);

const getAvailableMissions = (planetId, now = Date.now()) => {
  if (!planetId) {
    return [];
  }
  const origin = planetById.get(planetId);
  if (!origin) {
    return [];
  }
  const rotationSlot = Math.floor(now / (missionRotationMinutes * 60 * 1000));
  const rng = seededRandom(hashString(`${planetId}-${rotationSlot}`));
  const destinationPool = planets.filter((planet) => planet.id !== planetId);
  if (destinationPool.length === 0) {
    return [];
  }
  const generated = [];
  for (let i = 0; i < missionCount; i += 1) {
    const template = missionTemplates[Math.floor(rng() * missionTemplates.length)];
    const destination =
      destinationPool[Math.floor(rng() * destinationPool.length)] || destinationPool[0];
    const distance = getSystemDistance(origin.systemId, destination.systemId);
    const reward =
      template.baseReward + template.rewardPerJump * Math.max(1, distance) + Math.round(rng() * 180);
    const missionId = `${template.id}_${planetId}_${destination.id}_${rotationSlot}_${i}`;
    generated.push({
      id: missionId,
      type: template.type,
      title: template.title,
      description: formatMissionDescription(template, origin, destination),
      reward,
      cargo: template.cargo,
      cargoSpace: template.cargoSpace,
      fromPlanetId: planetId,
      toPlanetId: destination.id
    });
  }
  return generated;
};

module.exports = {
  initialWorld,
  systemById,
  planetById,
  canJump,
  getPlanetsInSystem,
  getAvailableMissions,
  getMarketForPlanet
};
