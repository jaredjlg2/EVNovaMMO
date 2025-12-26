const { systems, planets, ships, weapons, outfits, missions, factions } = require("./data");

const systemById = new Map(systems.map((system) => [system.id, system]));
const planetById = new Map(planets.map((planet) => [planet.id, planet]));

const initialWorld = {
  systems,
  planets,
  ships,
  weapons,
  outfits,
  missions,
  factions
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

const getAvailableMissions = (planetId) =>
  missions.filter((mission) => mission.fromPlanetId === planetId);

module.exports = {
  initialWorld,
  systemById,
  planetById,
  canJump,
  getPlanetsInSystem,
  getAvailableMissions
};
