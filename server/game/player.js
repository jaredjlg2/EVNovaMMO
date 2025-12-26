const { ships } = require("./data");

const starterShip = ships[0];

const createPlayer = ({ id, name }) => ({
  id,
  name,
  credits: 5000,
  systemId: "sol",
  planetId: "earth",
  ship: {
    id: starterShip.id,
    name: starterShip.name,
    hull: starterShip.hull,
    shield: starterShip.shield,
    cargo: starterShip.cargo,
    fuel: starterShip.fuel,
    hardpoints: starterShip.hardpoints
  },
  weapons: ["pulse_laser"],
  outfits: [],
  missions: [],
  log: ["Welcome to the frontier, Captain."]
});

module.exports = {
  createPlayer
};
