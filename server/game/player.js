const { ships, factions, storyArcs } = require("./data");

const starterShip = ships[0];

const buildBaseStoryState = () => {
  const baseArcs = storyArcs.reduce((acc, arc) => {
    acc[arc.id] = {
      status: "inactive",
      step: 0,
      rank: 0,
      pointOfNoReturnReached: false,
      flags: {}
    };
    return acc;
  }, {});

  return {
    arcLock: null,
    arcs: baseArcs,
    metrics: {
      honor: 0,
      corruption: 0
    },
    flags: {
      illegalTech: false,
      hypergateAccess: false,
      duelAccess: false,
      licenseWeapons: false,
      psychicSystems: false,
      bannedShipyards: false,
      contrabandAccess: false,
      exoticFuel: false,
      forbiddenEngines: false,
      neutralRep: false
    },
    visitedSystems: [],
    visitedPlanets: [],
    colonyIncomePerCycle: 0,
    lastColonyIncomeAt: Date.now()
  };
};

const mergeStoryState = (baseStory, savedStory = {}) => {
  return {
    ...baseStory,
    ...savedStory,
    arcs: {
      ...baseStory.arcs,
      ...(savedStory.arcs || {})
    },
    metrics: {
      ...baseStory.metrics,
      ...(savedStory.metrics || {})
    },
    flags: {
      ...baseStory.flags,
      ...(savedStory.flags || {})
    },
    visitedSystems: savedStory.visitedSystems ?? baseStory.visitedSystems,
    visitedPlanets: savedStory.visitedPlanets ?? baseStory.visitedPlanets,
    colonyIncomePerCycle:
      savedStory.colonyIncomePerCycle ?? baseStory.colonyIncomePerCycle,
    lastColonyIncomeAt:
      savedStory.lastColonyIncomeAt ?? baseStory.lastColonyIncomeAt
  };
};

const applyDefaultSecondaryLoadout = (player, ship) => {
  if (ship.defaultSecondaryWeapons?.length) {
    player.secondaryWeapons = ship.defaultSecondaryWeapons.slice(
      0,
      ship.secondaryHardpoints
    );
  }
  if (ship.defaultSecondaryAmmo) {
    player.secondaryAmmo = {};
    Object.entries(ship.defaultSecondaryAmmo).forEach(([ammoId, count]) => {
      if (count > 0) {
        player.secondaryAmmo[ammoId] = count;
      }
    });
  }
};

const createPlayer = ({ id, name, savedState = null }) => {
  const baseReputation = factions.reduce((acc, faction) => {
    acc[faction.id] = 0;
    return acc;
  }, {});
  const basePlayer = {
    id,
    name,
    credits: 5000,
    systemId: "sol",
    planetId: null,
    x: 0,
    y: 0,
    angle: -Math.PI / 2,
    ship: {
      id: starterShip.id,
      name: starterShip.name,
      hull: starterShip.hull,
      shield: starterShip.shield,
      cargo: starterShip.cargo,
      fuel: starterShip.fuel,
      hardpoints: starterShip.hardpoints,
      secondaryHardpoints: starterShip.secondaryHardpoints
    },
    hull: starterShip.hull,
    shield: starterShip.shield,
    weapons: ["pulse_laser"],
    secondaryWeapons: [],
    secondaryAmmo: {},
    outfits: [],
    missions: [],
    cargo: [],
    log: ["Welcome to the frontier, Captain."],
    escorts: [],
    reputation: baseReputation,
    legalStatus: 0,
    combatRating: 0,
    dominatedPlanets: [],
    lastTributeAt: Date.now(),
    story: buildBaseStoryState()
  };

  if (!savedState) {
    applyDefaultSecondaryLoadout(basePlayer, starterShip);
    return basePlayer;
  }

  return {
    ...basePlayer,
    ...savedState,
    id,
    name,
    story: mergeStoryState(basePlayer.story, savedState.story),
    ship: {
      ...basePlayer.ship,
      ...(savedState.ship || {})
    },
    hull: savedState.hull ?? basePlayer.hull,
    shield: savedState.shield ?? basePlayer.shield,
    weapons: savedState.weapons ?? basePlayer.weapons,
    secondaryWeapons: savedState.secondaryWeapons ?? basePlayer.secondaryWeapons,
    secondaryAmmo: savedState.secondaryAmmo ?? basePlayer.secondaryAmmo,
    outfits: savedState.outfits ?? basePlayer.outfits,
    missions: savedState.missions ?? basePlayer.missions,
    cargo: savedState.cargo ?? basePlayer.cargo,
    escorts: savedState.escorts ?? basePlayer.escorts,
    reputation: savedState.reputation ?? basePlayer.reputation,
    legalStatus: savedState.legalStatus ?? basePlayer.legalStatus,
    combatRating: savedState.combatRating ?? basePlayer.combatRating,
    dominatedPlanets: savedState.dominatedPlanets ?? basePlayer.dominatedPlanets,
    lastTributeAt: savedState.lastTributeAt ?? basePlayer.lastTributeAt
  };
};

module.exports = {
  createPlayer
};
