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
      hardpoints: starterShip.hardpoints
    },
    hull: starterShip.hull,
    shield: starterShip.shield,
    weapons: ["pulse_laser"],
    outfits: [],
    missions: [],
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
    shield: savedState.shield ?? basePlayer.shield
  };
};

module.exports = {
  createPlayer
};
