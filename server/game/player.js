const { ships, factions } = require("./data");

const starterShip = ships[0];

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
    lastTributeAt: Date.now()
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
