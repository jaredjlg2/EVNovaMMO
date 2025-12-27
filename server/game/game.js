const { createPlayer } = require("./player");
const { loadPilot, savePilot } = require("./storage");
const { getAiShipStatus, tickAiShips } = require("./ai");
const {
  initialWorld,
  planetById,
  canJump,
  getAvailableMissions,
  getMarketForPlanet
} = require("./world");

const players = new Map();
const weaponById = new Map(initialWorld.weapons.map((weapon) => [weapon.id, weapon]));
const shipById = new Map(initialWorld.ships.map((ship) => [ship.id, ship]));
const goodsById = new Map(initialWorld.goods.map((good) => [good.id, good]));
const tradeInRate = 0.6;

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
    secondaryWeapons: player.secondaryWeapons,
    outfits: player.outfits,
    missions: player.missions,
    cargo: player.cargo,
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

const getDockedPlanetService = (player, service) => {
  if (!player.planetId) {
    return null;
  }
  const planet = planetById.get(player.planetId);
  if (!planet || !planet[service]) {
    return null;
  }
  return planet;
};

const buyWeapon = (player, weaponId) => {
  if (!getDockedPlanetService(player, "outfitter")) {
    appendLog(player, "Outfitter service unavailable here.");
    return;
  }
  const weapon = initialWorld.weapons.find((item) => item.id === weaponId);
  if (!weapon) {
    appendLog(player, "Weapon unavailable.");
    return;
  }
  if (player.credits < weapon.price) {
    appendLog(player, "Insufficient credits.");
    return;
  }
  if (weapon.slotType === "secondary") {
    if (player.secondaryWeapons.length >= player.ship.secondaryHardpoints) {
      appendLog(player, "No available secondary racks.");
      return;
    }
    player.credits -= weapon.price;
    player.secondaryWeapons.push(weaponId);
    appendLog(player, `Purchased secondary ${weapon.name}.`);
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
  if (!getDockedPlanetService(player, "outfitter")) {
    appendLog(player, "Outfitter service unavailable here.");
    return;
  }
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

const buyShip = (player, shipId) => {
  if (!getDockedPlanetService(player, "shipyard")) {
    appendLog(player, "Shipyard service unavailable here.");
    return;
  }
  const ship = shipById.get(shipId);
  if (!ship) {
    appendLog(player, "Ship unavailable.");
    return;
  }
  if (player.ship.id === shipId) {
    appendLog(player, "Already piloting this ship.");
    return;
  }
  const currentShip = shipById.get(player.ship.id);
  const tradeInValue = currentShip ? Math.round(currentShip.price * tradeInRate) : 0;
  const netCost = Math.max(0, ship.price - tradeInValue);
  if (player.credits < netCost) {
    appendLog(player, "Insufficient credits.");
    return;
  }
  player.credits -= netCost;
  player.ship = {
    id: ship.id,
    name: ship.name,
    hull: ship.hull,
    shield: ship.shield,
    cargo: ship.cargo,
    fuel: ship.fuel,
    hardpoints: ship.hardpoints,
    secondaryHardpoints: ship.secondaryHardpoints
  };
  player.hull = ship.hull;
  player.shield = ship.shield;
  if (player.weapons.length > ship.hardpoints) {
    player.weapons = player.weapons.slice(0, ship.hardpoints);
    appendLog(player, "Hardpoints limited: some weapons were removed.");
  }
  if (player.secondaryWeapons.length > ship.secondaryHardpoints) {
    player.secondaryWeapons = player.secondaryWeapons.slice(0, ship.secondaryHardpoints);
    appendLog(player, "Secondary racks limited: some weapons were removed.");
  }
  appendLog(
    player,
    `Purchased ${ship.name}. Trade-in value: ${tradeInValue} credits.`
  );
};

const acceptMission = (player, missionId) => {
  const missions = getAvailableMissions(player.planetId);
  const mission = missions.find((item) => item.id === missionId);
  if (!mission) {
    appendLog(player, "Mission unavailable.");
    return;
  }
  if (player.missions.find((item) => item.id === missionId)) {
    appendLog(player, "Mission already accepted.");
    return;
  }
  const cargoUsed = getCargoUsed(player);
  if (cargoUsed + mission.cargoSpace > player.ship.cargo) {
    appendLog(player, "Insufficient cargo space for this mission.");
    return;
  }
  player.missions.push({
    id: mission.id,
    title: mission.title,
    type: mission.type,
    cargo: mission.cargo,
    cargoSpace: mission.cargoSpace,
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
  secondaryWeapons: player.secondaryWeapons,
  outfits: player.outfits,
  missions: player.missions,
  cargo: player.cargo,
  log: player.log
});

const getWorldState = () => initialWorld;

const getSystemStatus = () =>
  [
    ...Array.from(players.values()).map((player) => ({
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
    })),
    ...getAiShipStatus()
  ];

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

const getCargoUsed = (player) => {
  const cargoTotal = player.cargo.reduce((sum, entry) => sum + entry.quantity, 0);
  const missionCargo = player.missions
    .filter((mission) => mission.status === "active")
    .reduce((sum, mission) => sum + (mission.cargoSpace || 0), 0);
  return cargoTotal + missionCargo;
};

const upsertCargo = (player, goodId, quantity) => {
  const existing = player.cargo.find((entry) => entry.goodId === goodId);
  if (existing) {
    existing.quantity = Math.max(0, existing.quantity + quantity);
    if (existing.quantity === 0) {
      player.cargo = player.cargo.filter((entry) => entry.goodId !== goodId);
    }
  } else if (quantity > 0) {
    player.cargo.push({ goodId, quantity });
  }
};

const buyGoods = (player, goodId, quantity = 1) => {
  if (!player.planetId) {
    appendLog(player, "Dock at a planet to trade goods.");
    return;
  }
  const good = goodsById.get(goodId);
  if (!good) {
    appendLog(player, "Unknown commodity.");
    return;
  }
  const amount = Math.max(1, Math.min(50, Math.floor(quantity)));
  const cargoUsed = getCargoUsed(player);
  if (cargoUsed + amount > player.ship.cargo) {
    appendLog(player, "Insufficient cargo space.");
    return;
  }
  const market = getMarketForPlanet(player.planetId).find((entry) => entry.id === goodId);
  if (!market) {
    appendLog(player, "Market unavailable.");
    return;
  }
  const totalPrice = market.price * amount;
  if (player.credits < totalPrice) {
    appendLog(player, "Insufficient credits.");
    return;
  }
  player.credits -= totalPrice;
  upsertCargo(player, goodId, amount);
  appendLog(player, `Purchased ${amount} × ${good.name}.`);
};

const sellGoods = (player, goodId, quantity = 1) => {
  if (!player.planetId) {
    appendLog(player, "Dock at a planet to trade goods.");
    return;
  }
  const good = goodsById.get(goodId);
  if (!good) {
    appendLog(player, "Unknown commodity.");
    return;
  }
  const amount = Math.max(1, Math.min(50, Math.floor(quantity)));
  const existing = player.cargo.find((entry) => entry.goodId === goodId);
  if (!existing || existing.quantity < amount) {
    appendLog(player, "Insufficient cargo to sell.");
    return;
  }
  const market = getMarketForPlanet(player.planetId).find((entry) => entry.id === goodId);
  if (!market) {
    appendLog(player, "Market unavailable.");
    return;
  }
  const totalPrice = market.price * amount;
  upsertCargo(player, goodId, -amount);
  player.credits += totalPrice;
  appendLog(player, `Sold ${amount} × ${good.name}.`);
};

const getWeaponDamage = (weaponIds) => {
  const resolvedIds = weaponIds.length > 0 ? weaponIds : ["pulse_laser"];
  return resolvedIds.reduce((total, weaponId) => {
    const weapon = weaponById.get(weaponId);
    return total + (weapon ? weapon.damage : 0);
  }, 0);
};

const resolveWeaponIds = (weaponIds, { allowFallback }) => {
  if (weaponIds.length > 0) {
    return weaponIds;
  }
  return allowFallback ? ["pulse_laser"] : [];
};

const fireWeapons = (player, payload, weaponIds, { allowFallback = true } = {}) => {
  updatePosition(player, payload);
  const hits = [];
  const destroyed = [];
  const resolvedWeaponIds = resolveWeaponIds(weaponIds, { allowFallback });
  const damage = getWeaponDamage(resolvedWeaponIds);
  if (damage <= 0) {
    return { hits, destroyed, weaponsFired: [] };
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

  return { hits, destroyed, weaponsFired: resolvedWeaponIds };
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
  tickAiShips,
  updatePosition,
  fireWeapons,
  jumpSystem,
  dockPlanet,
  undock,
  buyWeapon,
  buyOutfit,
  buyShip,
  acceptMission,
  completeMissions,
  getAvailableMissions,
  getMarketForPlanet,
  buyGoods,
  sellGoods,
  getCargoUsed
};
