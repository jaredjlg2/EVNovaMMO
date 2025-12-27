const { createPlayer } = require("./player");
const { loadPilot, savePilot } = require("./storage");
const {
  initialWorld,
  planetById,
  canJump,
  getAvailableMissions
} = require("./world");

const players = new Map();
const weaponById = new Map(initialWorld.weapons.map((weapon) => [weapon.id, weapon]));

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
    x: player.x,
    y: player.y,
    angle: player.angle,
    ship: player.ship,
    hull: player.hull,
    shield: player.shield,
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
  player.planetId = null;
  player.x = 0;
  player.y = 0;
  appendLog(player, `Jumped to ${targetSystemId}.`);
};

const dockPlanet = (player, planetId) => {
  const planet = planetById.get(planetId);
  if (!planet || planet.systemId !== player.systemId) {
    appendLog(player, "Docking failed: planet not in system.");
    return;
  }
  player.planetId = planetId;
  player.x = 0;
  player.y = 0;
  appendLog(player, `Docked at ${planet.name}.`);
};

const undock = (player) => {
  if (!player.planetId) {
    appendLog(player, "Already in open space.");
    return;
  }
  player.planetId = null;
  player.x = 0;
  player.y = 0;
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
  x: player.x,
  y: player.y,
  angle: player.angle,
  ship: player.ship,
  hull: player.hull,
  shield: player.shield,
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
    ship: player.ship,
    x: player.x,
    y: player.y,
    angle: player.angle,
    hull: player.hull,
    shield: player.shield
  }));

const updatePosition = (player, { x, y, angle }) => {
  if (typeof x === "number") {
    player.x = x;
  }
  if (typeof y === "number") {
    player.y = y;
  }
  if (typeof angle === "number") {
    player.angle = angle;
  }
};

const normalizeAngle = (angle) => {
  let adjusted = angle;
  while (adjusted > Math.PI) {
    adjusted -= Math.PI * 2;
  }
  while (adjusted < -Math.PI) {
    adjusted += Math.PI * 2;
  }
  return adjusted;
};

const getWeaponDamage = (player) => {
  const weaponIds = player.weapons.length > 0 ? player.weapons : ["pulse_laser"];
  return weaponIds.reduce((total, weaponId) => {
    const weapon = weaponById.get(weaponId);
    return total + (weapon ? weapon.damage : 0);
  }, 0);
};

const fireWeapons = (player, payload) => {
  updatePosition(player, payload);
  const hits = [];
  const destroyed = [];
  const damage = getWeaponDamage(player);
  if (damage <= 0) {
    return { hits, destroyed };
  }
  const originX = player.x;
  const originY = player.y;
  const angle = player.angle;
  const maxRange = 320;
  const maxAngleDiff = 0.35;

  Array.from(players.values()).forEach((target) => {
    if (target.id === player.id) {
      return;
    }
    if (target.systemId !== player.systemId || target.planetId) {
      return;
    }
    if (typeof target.x !== "number" || typeof target.y !== "number") {
      return;
    }
    const dx = target.x - originX;
    const dy = target.y - originY;
    const distance = Math.hypot(dx, dy);
    if (distance > maxRange) {
      return;
    }
    const targetAngle = Math.atan2(dy, dx);
    const angleDiff = Math.abs(normalizeAngle(targetAngle - angle));
    if (angleDiff > maxAngleDiff) {
      return;
    }
    target.hull = Math.max(0, target.hull - damage);
    appendLog(target, `${player.name} hit you for ${damage} damage.`);
    appendLog(player, `You hit ${target.name} for ${damage} damage.`);
    if (target.hull === 0) {
      destroyed.push({
        id: target.id,
        name: target.name,
        systemId: target.systemId,
        x: target.x,
        y: target.y
      });
      appendLog(target, "Ship destroyed! Rescue crews will tow you back once you relog.");
      appendLog(player, `${target.name} was destroyed.`);
    }
    hits.push(target.id);
  });

  return { hits, destroyed };
};

module.exports = {
  addPlayer,
  removePlayer,
  getPlayer,
  getPlayerByName,
  persistPlayer,
  getPlayerState,
  getWorldState,
  getSystemStatus,
  updatePosition,
  fireWeapons,
  jumpSystem,
  dockPlanet,
  undock,
  buyWeapon,
  buyOutfit,
  acceptMission,
  completeMissions,
  getAvailableMissions
};
