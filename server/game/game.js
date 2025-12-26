const { createPlayer } = require("./player");
const { loadPilot, savePilot } = require("./storage");
const {
  initialWorld,
  planetById,
  canJump,
  getPlanetsInSystem,
  getAvailableMissions
} = require("./world");

const players = new Map();

const getPlayer = (id) => players.get(id);

const addPlayer = ({ id, name }) => {
  const savedState = loadPilot(name);
  const player = createPlayer({ id, name, savedState });
  players.set(id, player);
  return player;
};

const removePlayer = (id) => {
  players.delete(id);
};

const getPlayerByName = (name) =>
  Array.from(players.values()).find((player) => player.name === name);

const persistPlayer = (player) => {
  savePilot(player.name, {
    name: player.name,
    credits: player.credits,
    systemId: player.systemId,
    planetId: player.planetId,
    ship: player.ship,
    weapons: player.weapons,
    outfits: player.outfits,
    missions: player.missions,
    log: player.log
  });
};

const appendLog = (player, message) => {
  player.log = [message, ...player.log].slice(0, 8);
};

const jumpSystem = (player, targetSystemId) => {
  if (!canJump(player.systemId, targetSystemId)) {
    appendLog(player, "Hyperjump failed: system not in range.");
    return;
  }
  player.systemId = targetSystemId;
  const destinationPlanets = getPlanetsInSystem(targetSystemId);
  player.planetId = destinationPlanets[0]?.id ?? null;
  appendLog(player, `Jumped to ${targetSystemId}.`);
};

const dockPlanet = (player, planetId) => {
  const planet = planetById.get(planetId);
  if (!planet || planet.systemId !== player.systemId) {
    appendLog(player, "Docking failed: planet not in system.");
    return;
  }
  player.planetId = planetId;
  appendLog(player, `Docked at ${planet.name}.`);
};

const undock = (player) => {
  if (!player.planetId) {
    appendLog(player, "Already in open space.");
    return;
  }
  player.planetId = null;
  appendLog(player, "Launched into space.");
};

const buyWeapon = (player, weaponId) => {
  const weapon = initialWorld.weapons.find((item) => item.id === weaponId);
  if (!weapon) {
    appendLog(player, "Weapon unavailable.");
    return;
  }
  if (player.credits < weapon.price) {
    appendLog(player, "Insufficient credits.");
    return;
  }
  if (player.weapons.length >= player.ship.hardpoints) {
    appendLog(player, "No available hardpoints.");
    return;
  }
  player.credits -= weapon.price;
  player.weapons.push(weaponId);
  appendLog(player, `Purchased ${weapon.name}.`);
};

const buyOutfit = (player, outfitId) => {
  const outfit = initialWorld.outfits.find((item) => item.id === outfitId);
  if (!outfit) {
    appendLog(player, "Outfit unavailable.");
    return;
  }
  if (player.credits < outfit.price) {
    appendLog(player, "Insufficient credits.");
    return;
  }
  player.credits -= outfit.price;
  player.outfits.push(outfitId);
  appendLog(player, `Installed ${outfit.name}.`);
};

const acceptMission = (player, missionId) => {
  const mission = initialWorld.missions.find((item) => item.id === missionId);
  if (!mission) {
    appendLog(player, "Mission unavailable.");
    return;
  }
  if (player.missions.find((item) => item.id === missionId)) {
    appendLog(player, "Mission already accepted.");
    return;
  }
  player.missions.push({
    id: mission.id,
    title: mission.title,
    fromPlanetId: mission.fromPlanetId,
    toPlanetId: mission.toPlanetId,
    reward: mission.reward,
    status: "active"
  });
  appendLog(player, `Accepted mission: ${mission.title}.`);
};

const completeMissions = (player) => {
  let completed = 0;
  player.missions = player.missions.map((mission) => {
    if (mission.status === "active" && mission.toPlanetId === player.planetId) {
      completed += 1;
      return { ...mission, status: "complete" };
    }
    return mission;
  });
  if (completed > 0) {
    const reward = player.missions
      .filter((mission) => mission.status === "complete" && mission.toPlanetId === player.planetId)
      .reduce((total, mission) => total + mission.reward, 0);
    player.credits += reward;
    appendLog(player, `Completed ${completed} mission(s). Reward: ${reward} credits.`);
  } else {
    appendLog(player, "No missions to complete here.");
  }
};

const getPlayerState = (player) => ({
  id: player.id,
  name: player.name,
  credits: player.credits,
  systemId: player.systemId,
  planetId: player.planetId,
  ship: player.ship,
  weapons: player.weapons,
  outfits: player.outfits,
  missions: player.missions,
  log: player.log
});

const getWorldState = () => initialWorld;

const getSystemStatus = () =>
  Array.from(players.values()).map((player) => ({
    id: player.id,
    name: player.name,
    systemId: player.systemId,
    planetId: player.planetId,
    ship: player.ship
  }));

module.exports = {
  addPlayer,
  removePlayer,
  getPlayer,
  getPlayerByName,
  persistPlayer,
  getPlayerState,
  getWorldState,
  getSystemStatus,
  jumpSystem,
  dockPlanet,
  undock,
  buyWeapon,
  buyOutfit,
  acceptMission,
  completeMissions,
  getAvailableMissions
};
