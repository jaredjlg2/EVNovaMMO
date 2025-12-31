const { ships } = require("./data");

const starterShip = ships[0];

const createPlayer = ({ id, name, savedState = null }) => {
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
    log: ["Welcome to the frontier, Captain."]
  };

  if (!savedState) {
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
    cargo: savedState.cargo ?? basePlayer.cargo
  };
};

module.exports = {
  createPlayer
};
