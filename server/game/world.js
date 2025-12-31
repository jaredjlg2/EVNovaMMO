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
  tradeRoutes,
  factions,
  storyArcs
} = require("./data");

const systemById = new Map(systems.map((system) => [system.id, system]));
const planetById = new Map(planets.map((planet) => [planet.id, planet]));

const validateGalaxyLinks = () => {
  const warnings = [];
  systems.forEach((system) => {
    if (!system.links || system.links.length === 0) {
      warnings.push(`System ${system.id} has no neighbors.`);
    }
    (system.links || []).forEach((neighborId) => {
      const neighbor = systemById.get(neighborId);
      if (!neighbor) {
        warnings.push(`System ${system.id} links to missing neighbor ${neighborId}.`);
        return;
      }
      if (!neighbor.links.includes(system.id)) {
        warnings.push(
          `System ${system.id} links to ${neighborId} without reciprocal link.`
        );
      }
    });
  });
  if (warnings.length > 0) {
    console.warn("[Galaxy Validation]", warnings.join(" "));
  }
};

validateGalaxyLinks();

const initialWorld = {
  systems,
  planets,
  ships,
  weapons,
  outfits,
  missions,
  goods,
  markets,
  tradeRoutes,
  factions,
  storyArcs
};

const marketLevels = {
  low: 0.6,
  medium: 1,
  high: 1.55,
  contraband: 2.1
};

const missionRotationMinutes = 20;
const missionCount = 5;
const marketRotationMinutes = 30;

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

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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

const getFactionReputation = (player, factionId) =>
  player?.reputation?.[factionId] ?? 0;

const hasVisitedSystem = (player, systemId) =>
  Boolean(player?.story?.visitedSystems?.includes(systemId));

const hasVisitedPlanet = (player, planetId) =>
  Boolean(player?.story?.visitedPlanets?.includes(planetId));

const isTemplateAvailable = (template, origin, player) => {
  if (template.arcId) {
    if (!player?.story) {
      return false;
    }
    const arcState = player.story.arcs?.[template.arcId];
    if (template.arcStatusRequired && arcState?.status !== template.arcStatusRequired) {
      return false;
    }
    if (typeof template.arcStepMin === "number" && (arcState?.step ?? 0) < template.arcStepMin) {
      return false;
    }
    if (typeof template.arcStepMax === "number" && (arcState?.step ?? 0) > template.arcStepMax) {
      return false;
    }
    if (template.arcRequiresLock && player.story.arcLock !== template.arcId) {
      return false;
    }
    if (player.story.arcLock && player.story.arcLock !== template.arcId) {
      if (template.arcConflictBehavior !== "betrayal") {
        return false;
      }
      const lockedArc = player.story.arcs?.[player.story.arcLock];
      if (lockedArc?.pointOfNoReturnReached) {
        return false;
      }
    }
    if (template.arcRequirements) {
      const requirements = template.arcRequirements;
      if (requirements.requiresSystemId && !hasVisitedSystem(player, requirements.requiresSystemId)) {
        return false;
      }
      if (requirements.requiresPlanetId && !hasVisitedPlanet(player, requirements.requiresPlanetId)) {
        return false;
      }
      if (requirements.requiresShipId && player.ship?.id !== requirements.requiresShipId) {
        return false;
      }
      if (
        typeof requirements.minCargoCapacity === "number" &&
        (player.ship?.cargo ?? 0) < requirements.minCargoCapacity
      ) {
        return false;
      }
      if (requirements.minReputationByFactionId) {
        const repEntries = Object.entries(requirements.minReputationByFactionId);
        for (const [factionId, minimum] of repEntries) {
          if (getFactionReputation(player, factionId) < minimum) {
            return false;
          }
        }
      }
    }
  }
  if (template.requiresBlackMarket && !origin?.blackMarket) {
    return false;
  }
  if (template.minCombatRating && (player?.combatRating ?? 0) < template.minCombatRating) {
    return false;
  }
  if (template.maxLegalStatus && (player?.legalStatus ?? 0) > template.maxLegalStatus) {
    return false;
  }
  if (template.minReputation && origin?.systemId) {
    const system = systemById.get(origin.systemId);
    const factionRep = getFactionReputation(player, system?.factionId);
    if (factionRep < template.minReputation) {
      return false;
    }
  }
  return true;
};

const pickWeighted = (items, rng) => {
  if (!items.length) {
    return null;
  }
  const total = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight ?? 1;
    if (roll <= 0) {
      return item;
    }
  }
  return items[0];
};

const getContrabandScanRisk = (planetId) => {
  const planet = planetById.get(planetId);
  const system = planet ? systemById.get(planet.systemId) : null;
  const baseRisk = {
    core: 0.32,
    border: 0.22,
    frontier: 0.14
  }[system?.status || "border"] ?? 0.2;
  const trafficBoost = {
    heavy: 0.08,
    medium: 0.04,
    light: 0
  }[system?.traffic || "medium"] ?? 0.04;
  const marketRelief = planet?.blackMarket ? -0.12 : 0;
  return clamp(baseRisk + trafficBoost + marketRelief, 0.05, 0.45);
};

const getMarketForPlanet = (planetId) => {
  const planet = planetById.get(planetId);
  if (!planet) {
    return [];
  }
  const market = markets[planetId] || {};
  const rotationSlot = Math.floor(Date.now() / (marketRotationMinutes * 60 * 1000));
  return goods.flatMap((good) => {
    if (good.isContraband && !planet.blackMarket) {
      return [];
    }
    const level =
      market[good.id] ||
      (good.isContraband ? "contraband" : "medium");
    const baseMultiplier = marketLevels[level] ?? 1;
    const rng = seededRandom(
      hashString(`${planetId}-${good.id}-${rotationSlot}`)
    );
    const variance = clamp(0.82 + rng() * 0.4, 0.72, 1.4);
    let routeMultiplier = 1;
    let routeHint = null;
    tradeRoutes.forEach((route) => {
      if (route.goodId !== good.id) {
        return;
      }
      if (route.fromPlanetId === planetId) {
        routeMultiplier *= 0.78;
        routeHint = `Export route to ${planetById.get(route.toPlanetId)?.name || "neighbor"}`;
      }
      if (route.toPlanetId === planetId) {
        routeMultiplier *= 1.32;
        routeHint = `Import route from ${planetById.get(route.fromPlanetId)?.name || "neighbor"}`;
      }
    });
    const price = Math.round(good.basePrice * baseMultiplier * variance * routeMultiplier);
    return [
      {
        id: good.id,
        name: good.name,
        basePrice: good.basePrice,
        level,
        price,
        volume: Math.round(10 + rng() * 20),
        isContraband: Boolean(good.isContraband),
        routeHint,
        scanRisk: good.isContraband ? getContrabandScanRisk(planetId) : 0
      }
    ];
  });
};

const formatMissionDescription = (template, origin, destination) =>
  template.description
    .replace("{origin}", origin?.name ?? "Unknown")
    .replace("{destination}", destination?.name ?? "Unknown")
    .replace("{cargo}", template.cargo);

const getAvailableMissions = (playerOrPlanetId, now = Date.now()) => {
  const planetId =
    typeof playerOrPlanetId === "string"
      ? playerOrPlanetId
      : playerOrPlanetId?.planetId;
  const player = typeof playerOrPlanetId === "string" ? null : playerOrPlanetId;
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
  const availableTemplates = missionTemplates.filter((template) =>
    isTemplateAvailable(template, origin, player)
  );
  if (availableTemplates.length === 0) {
    return [];
  }
  const generated = [];
  for (let i = 0; i < missionCount; i += 1) {
    const template = pickWeighted(availableTemplates, rng);
    if (!template) {
      continue;
    }
    const destination =
      destinationPool[Math.floor(rng() * destinationPool.length)] || destinationPool[0];
    const distance = getSystemDistance(origin.systemId, destination.systemId);
    const distanceReward = (template.rewardPerJump || 0) * Math.max(1, distance);
    const cargoBonus = (template.cargoSpace || 0) * (template.rewardPerCargo || 0);
    const variance = Math.round(rng() * (template.rewardVariance ?? 2500));
    let reward = (template.baseReward || 0) + distanceReward + cargoBonus + variance;
    if (template.minReward) {
      reward = Math.max(template.minReward, reward);
    }
    if (template.maxReward) {
      reward = Math.min(template.maxReward, reward);
    }
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
      toPlanetId: destination.id,
      factionId: systemById.get(origin.systemId)?.factionId || null,
      timeLimitMinutes: template.timeLimitMinutes || null,
      targetRoles: template.targetRoles || null,
      legalRisk:
        template.type === "smuggling" || template.type === "united_shipping_long"
          ? "high"
          : template.type === "rush"
            ? "medium"
            : "low",
      arcId: template.arcId || null,
      arcTemplateType: template.arcTemplateType || null,
      arcStepMin: template.arcStepMin ?? null,
      arcAdvanceStep: template.arcAdvanceStep ?? null,
      arcCommitOnAccept: Boolean(template.arcCommitOnAccept),
      arcCommitOnComplete: Boolean(template.arcCommitOnComplete),
      arcConflictBehavior: template.arcConflictBehavior || null,
      arcPointOfNoReturn: Boolean(template.arcPointOfNoReturn),
      arcFailureResets: Boolean(template.arcFailureResets),
      arcEffects: template.arcEffects || null
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
