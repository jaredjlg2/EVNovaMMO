const { createPlayer } = require("./player");
const { loadPilot, savePilot } = require("./storage");
const {
  getAiShipStatus,
  tickAiShips,
  getAiShips,
  markShipHostileToPlayer,
  getRoleCombatProfile,
  getAiShipById,
  updateDisabledStatus,
  createEscortShip,
  assignShipAsEscort,
  removeAiShip,
  disableThresholds
} = require("./ai");
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
const shieldRegenRate = 0.08;
const armorRegenRate = 0.04;
const boardingRange = 60;

const getSecondaryAmmoCount = (player, ammoId) =>
  Math.max(0, player.secondaryAmmo?.[ammoId] ?? 0);

const adjustSecondaryAmmo = (player, ammoId, delta) => {
  if (!player.secondaryAmmo) {
    player.secondaryAmmo = {};
  }
  const current = getSecondaryAmmoCount(player, ammoId);
  const next = Math.max(0, current + delta);
  if (next === 0) {
    delete player.secondaryAmmo[ammoId];
    return;
  }
  player.secondaryAmmo[ammoId] = next;
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

const refillDefaultSecondaryAmmo = (player, ship) => {
  if (!ship?.defaultSecondaryAmmo) {
    return;
  }
  if (!player.secondaryAmmo) {
    player.secondaryAmmo = {};
  }
  Object.entries(ship.defaultSecondaryAmmo).forEach(([ammoId, count]) => {
    if (count > 0) {
      player.secondaryAmmo[ammoId] = count;
    }
  });
};

const resolveSecondaryWeaponId = (player, requestedId) => {
  if (requestedId && player.secondaryWeapons.includes(requestedId)) {
    return requestedId;
  }
  return player.secondaryWeapons[0] ?? null;
};

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

const getPlayers = () => Array.from(players.values());

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
    secondaryAmmo: player.secondaryAmmo,
    outfits: player.outfits,
    missions: player.missions,
    cargo: player.cargo,
    log: player.log,
    escorts: player.escorts
  });
};

const appendLog = (player, message) => {
  player.log = [message, ...player.log].slice(0, 8);
};

const applyDamageToTarget = (target, damage) => {
  const shieldDamage = Math.min(target.shield, damage);
  target.shield = Math.max(0, target.shield - shieldDamage);
  const remaining = damage - shieldDamage;
  if (remaining > 0) {
    target.hull = Math.max(0, target.hull - remaining);
  }
  if (target.ai) {
    updateDisabledStatus(target);
  }
  return target.hull === 0;
};

const getEscortSummary = (escortShip) => ({
  id: escortShip.id,
  name: escortShip.name,
  ship: escortShip.ship,
  hired: Boolean(escortShip.ai.hired),
  dailyRate: escortShip.ai.dailyRate || 0
});

const removeEscortFromPlayer = (player, escortId) => {
  player.escorts = (player.escorts || []).filter((escort) => escort.id !== escortId);
};

const releaseEscort = (player, escortId) => {
  const escorts = player.escorts || [];
  const escort = escorts.find((entry) => entry.id === escortId);
  if (!escort) {
    appendLog(player, "No escort found to release.");
    return;
  }
  removeAiShip(escortId);
  removeEscortFromPlayer(player, escortId);
  appendLog(player, `Released escort: ${escort.name}.`);
};

const applyEscortDailyRate = (player, reason) => {
  const hiredEscorts = (player.escorts || []).filter((escort) => escort.hired);
  if (hiredEscorts.length === 0) {
    return;
  }
  const totalRate = hiredEscorts.reduce((sum, escort) => sum + (escort.dailyRate || 0), 0);
  if (totalRate <= 0) {
    return;
  }
  if (player.credits >= totalRate) {
    player.credits -= totalRate;
    appendLog(
      player,
      `Paid ${totalRate} credits in escort wages (${reason}).`
    );
    return;
  }
  hiredEscorts.forEach((escort) => {
    removeAiShip(escort.id);
    removeEscortFromPlayer(player, escort.id);
  });
  appendLog(
    player,
    "Unable to cover escort wages. Hired escorts have departed."
  );
};

const moveEscortsToPlayer = (player) => {
  const escorts = getAiShips().filter((ship) => ship.ai.ownerId === player.id);
  escorts.forEach((escort, index) => {
    escort.systemId = player.systemId;
    escort.planetId = null;
    escort.x = player.x + Math.cos(index) * 40;
    escort.y = player.y + Math.sin(index) * 40;
    escort.vx = 0;
    escort.vy = 0;
    escort.ai.escortMode = escort.ai.escortMode || "follow";
  });
};

const jumpSystem = (player, targetSystemId) => {
  if (!canJump(player.systemId, targetSystemId)) {
    appendLog(player, "Hyperjump failed: system not in range.");
    return;
  }
  applyEscortDailyRate(player, "jump");
  player.systemId = targetSystemId;
  player.planetId = null;
  player.x = 0;
  player.y = 0;
  moveEscortsToPlayer(player);
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
  refillDefaultSecondaryAmmo(player, shipById.get(player.ship.id));
  appendLog(player, `Docked at ${planet.name}.`);
};

const undock = (player) => {
  if (!player.planetId) {
    appendLog(player, "Already in open space.");
    return;
  }
  applyEscortDailyRate(player, "departure");
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
  if (weapon.slotType === "secondaryAmmo") {
    if (!weapon.ammoFor) {
      appendLog(player, "Ammo unavailable.");
      return;
    }
    if (!player.secondaryWeapons.includes(weapon.ammoFor)) {
      const launcherName = weaponById.get(weapon.ammoFor)?.name || "launcher";
      appendLog(player, `Install a ${launcherName} before buying ammo.`);
      return;
    }
    player.credits -= weapon.price;
    adjustSecondaryAmmo(player, weapon.id, 1);
    appendLog(player, `Purchased ${weapon.name}.`);
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

const applyShipToPlayer = (player, ship) => {
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
  if (ship.defaultSecondaryWeapons?.length || ship.defaultSecondaryAmmo) {
    applyDefaultSecondaryLoadout(player, ship);
  } else if (player.secondaryWeapons.length > ship.secondaryHardpoints) {
    player.secondaryWeapons = player.secondaryWeapons.slice(
      0,
      ship.secondaryHardpoints
    );
    appendLog(player, "Secondary racks limited: some weapons were removed.");
  }
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
  applyShipToPlayer(player, ship);
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
  if (cargoUsed + mission.cargoSpace > getCargoCapacity(player)) {
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
  secondaryAmmo: player.secondaryAmmo,
  outfits: player.outfits,
  missions: player.missions,
  cargo: player.cargo,
  log: player.log,
  escorts: player.escorts
});

const getWorldState = () => initialWorld;

const buildPlayerStatus = (player) => ({
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
});

const getSystemStatus = () =>
  [
    ...Array.from(players.values()).map((player) => buildPlayerStatus(player)),
    ...getAiShipStatus()
  ];

const getSystemStatusForSystem = (systemId) => {
  if (!systemId) {
    return getSystemStatus();
  }
  const playerStatus = Array.from(players.values())
    .filter((player) => player.systemId === systemId)
    .map((player) => buildPlayerStatus(player));
  const aiStatus = getAiShipStatus().filter((ship) => ship.systemId === systemId);
  return [...playerStatus, ...aiStatus];
};

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

const tickWorld = (deltaSeconds) => {
  tickAiShips(deltaSeconds, Array.from(players.values()));
  const now = Date.now();
  const hitPlayers = [];
  const destroyedPlayers = [];
  const aiShots = [];

  players.forEach((current) => {
    if (current.shield < current.ship.shield) {
      const shieldGain = current.ship.shield * shieldRegenRate * deltaSeconds;
      current.shield = Math.min(current.ship.shield, current.shield + shieldGain);
    }
    if (current.planetId && current.hull < current.ship.hull) {
      const armorGain = current.ship.hull * armorRegenRate * deltaSeconds;
      current.hull = Math.min(current.ship.hull, current.hull + armorGain);
    }
  });

  getAiShips().forEach((ship) => {
    if (ship.ai.ownerId || ship.ai.disabled) {
      return;
    }
    const hostileTo = ship.ai.hostileTo || new Set();
    if (hostileTo.size === 0) {
      return;
    }
    const roleProfile = getRoleCombatProfile(ship.ai.role);
    let closestTarget = null;
    let closestDistance = Infinity;
    players.forEach((target) => {
      if (!hostileTo.has(target.id)) {
        return;
      }
      if (target.systemId !== ship.systemId || target.planetId) {
        return;
      }
      const distance = Math.hypot(ship.x - target.x, ship.y - target.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    });
    if (!closestTarget) {
      return;
    }
    ship.ai.state = "engage";
    ship.ai.stateUntil = now + 5000;
    ship.ai.targetX = closestTarget.x;
    ship.ai.targetY = closestTarget.y;

    if (closestDistance > roleProfile.range) {
      return;
    }
    if (now - ship.ai.lastAttackAt < 1200) {
      return;
    }
    const damage = Math.round(roleProfile.damage * (0.7 + Math.random() * 0.6));
    const isDestroyed = applyDamageToTarget(closestTarget, damage);
    appendLog(closestTarget, `${ship.name} hit you for ${damage} damage.`);
    hitPlayers.push(closestTarget.id);
    ship.ai.lastAttackAt = now;
    aiShots.push({
      shooterId: ship.id,
      systemId: ship.systemId,
      x: ship.x,
      y: ship.y,
      angle: ship.angle,
      weapons: ["pulse_laser"]
    });
    if (isDestroyed) {
      destroyedPlayers.push({
        id: closestTarget.id,
        name: closestTarget.name,
        systemId: closestTarget.systemId,
        x: closestTarget.x,
        y: closestTarget.y
      });
      appendLog(closestTarget, "Ship destroyed! Rescue crews will tow you back once you relog.");
    }
  });

  getAiShips().forEach((ship) => {
    if (!ship.ai.ownerId || ship.ai.disabled || ship.ai.escortMode !== "attack") {
      return;
    }
    const owner = players.get(ship.ai.ownerId);
    if (!owner || owner.systemId !== ship.systemId || owner.planetId) {
      return;
    }
    const targetId = ship.ai.escortTargetId;
    if (!targetId) {
      return;
    }
    const targetPlayer = players.get(targetId);
    const targetAi = getAiShips().find((entry) => entry.id === targetId);
    const target = targetPlayer || targetAi;
    if (!target || target.systemId !== ship.systemId || target.planetId) {
      ship.ai.escortMode = "follow";
      ship.ai.escortTargetId = null;
      return;
    }
    const roleProfile = getRoleCombatProfile(ship.ai.role);
    const distance = Math.hypot(ship.x - target.x, ship.y - target.y);
    if (distance > roleProfile.range) {
      return;
    }
    if (now - ship.ai.lastAttackAt < 1200) {
      return;
    }
    const damage = Math.round(roleProfile.damage * (0.7 + Math.random() * 0.6));
    const isDestroyed = applyDamageToTarget(target, damage);
    if (targetPlayer) {
      appendLog(targetPlayer, `${ship.name} hit you for ${damage} damage.`);
      appendLog(owner, `Escort ${ship.name} hit ${targetPlayer.name} for ${damage}.`);
    } else if (targetAi) {
      markShipHostileToPlayer(targetAi.id, owner.id);
      appendLog(owner, `Escort ${ship.name} hit ${targetAi.name} for ${damage}.`);
    }
    ship.ai.lastAttackAt = now;
    aiShots.push({
      shooterId: ship.id,
      systemId: ship.systemId,
      x: ship.x,
      y: ship.y,
      angle: ship.angle,
      weapons: ["pulse_laser"],
      targetId: target.id
    });
    if (isDestroyed) {
      if (targetPlayer) {
        destroyedPlayers.push({
          id: targetPlayer.id,
          name: targetPlayer.name,
          systemId: targetPlayer.systemId,
          x: targetPlayer.x,
          y: targetPlayer.y
        });
        appendLog(targetPlayer, "Ship destroyed! Rescue crews will tow you back once you relog.");
      } else if (targetAi) {
        destroyedPlayers.push({
          id: targetAi.id,
          name: targetAi.name,
          systemId: targetAi.systemId,
          x: targetAi.x,
          y: targetAi.y,
          isAi: true
        });
      }
    }
  });

  return { hitPlayers, destroyedPlayers, aiShots };
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

const getEscortCargoCapacity = (player) =>
  (player.escorts || []).reduce((sum, escort) => sum + (escort.ship?.cargo || 0), 0);

const getCargoCapacity = (player) => (player.ship?.cargo || 0) + getEscortCargoCapacity(player);

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
  if (cargoUsed + amount > getCargoCapacity(player)) {
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

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getEscortHireShips = () =>
  initialWorld.ships.filter((ship) =>
    ["wisp_runner", "bastion_guard", "ironclad"].includes(ship.id)
  );

const getEscortDailyRate = (ship) => Math.max(60, Math.round(ship.price * 0.02));

const getEscortHireOffers = () => {
  const pool = getEscortHireShips();
  const offers = [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  shuffled.slice(0, 3).forEach((ship) => {
    offers.push({
      shipId: ship.id,
      name: ship.name,
      cargo: ship.cargo,
      dailyRate: getEscortDailyRate(ship)
    });
  });
  return offers;
};

const hireEscort = (player, shipId) => {
  if (!player.planetId) {
    appendLog(player, "Dock at a planet to hire escorts.");
    return null;
  }
  const ship = shipById.get(shipId);
  if (!ship) {
    appendLog(player, "Escort unavailable.");
    return null;
  }
  const dailyRate = getEscortDailyRate(ship);
  if (player.credits < dailyRate) {
    appendLog(player, "Insufficient credits to hire that escort.");
    return null;
  }
  const formationIndex = (player.escorts || []).length;
  const offsetAngle = Math.random() * Math.PI * 2;
  const escort = createEscortShip({
    ship,
    systemId: player.systemId,
    x: player.x + Math.cos(offsetAngle) * 60,
    y: player.y + Math.sin(offsetAngle) * 60,
    ownerId: player.id,
    name: `${ship.name} Escort`,
    role: "escort",
    formationIndex,
    hired: true,
    dailyRate
  });
  if (!escort) {
    appendLog(player, "Escort hiring failed.");
    return null;
  }
  if (!player.escorts) {
    player.escorts = [];
  }
  player.escorts.push({
    ...getEscortSummary(escort),
    mode: escort.ai.escortMode
  });
  appendLog(player, `Hired escort: ${escort.name} (${dailyRate} credits/day).`);
  return escort;
};

const setEscortCommand = (player, command, targetId = null) => {
  const escorts = player.escorts || [];
  if (escorts.length === 0) {
    appendLog(player, "No escorts available.");
    return;
  }
  escorts.forEach((escort) => {
    const escortShip = getAiShipById(escort.id);
    if (!escortShip || escortShip.ai.ownerId !== player.id) {
      return;
    }
    if (command === "attack" && targetId) {
      escortShip.ai.escortMode = "attack";
      escortShip.ai.escortTargetId = targetId;
      escortShip.ai.holdX = null;
      escortShip.ai.holdY = null;
    } else if (command === "hold") {
      escortShip.ai.escortMode = "hold";
      escortShip.ai.escortTargetId = null;
      escortShip.ai.holdX = escortShip.x;
      escortShip.ai.holdY = escortShip.y;
    } else {
      escortShip.ai.escortMode = "follow";
      escortShip.ai.escortTargetId = null;
      escortShip.ai.holdX = null;
      escortShip.ai.holdY = null;
    }
    escort.mode = escortShip.ai.escortMode;
  });
  const actionLabel =
    command === "attack"
      ? "Attack run acknowledged."
      : command === "hold"
        ? "Escorts holding position."
        : "Escorts returning to formation.";
  appendLog(player, actionLabel);
};

const getBoardableShip = (player, targetId) => {
  const ship = getAiShipById(targetId);
  if (!ship || ship.ai.ownerId) {
    return null;
  }
  if (ship.systemId !== player.systemId || ship.planetId) {
    return null;
  }
  if (!ship.ai.disabled) {
    return null;
  }
  const distance = Math.hypot(ship.x - player.x, ship.y - player.y);
  if (distance > boardingRange) {
    return null;
  }
  return ship;
};

const getCaptureChance = (ship) => {
  const range = disableThresholds.maxHull - disableThresholds.minHull;
  const damageFactor = clamp(
    (disableThresholds.maxHull - ship.hull) / range,
    0,
    1
  );
  return clamp(0.35 + damageFactor * 0.4, 0.2, 0.85);
};

const getCargoValue = (cargo) =>
  (cargo || []).reduce((total, entry) => {
    const good = goodsById.get(entry.goodId);
    const unitPrice = good?.basePrice ?? 0;
    return total + unitPrice * entry.quantity;
  }, 0);

const getLootChance = (ship) => {
  const range = disableThresholds.maxHull - disableThresholds.minHull;
  const damageFactor = clamp(
    (disableThresholds.maxHull - ship.hull) / range,
    0,
    1
  );
  return clamp(0.65 + damageFactor * 0.2, 0.5, 0.9);
};

const getBoardingPayload = (ship) => {
  const cargo = ship.cargo || [];
  return {
    id: ship.id,
    name: ship.name,
    ship: ship.ship,
    cargo,
    cargoValue: getCargoValue(cargo),
    credits: ship.credits || 0,
    captureChance: getCaptureChance(ship),
    lootChance: getLootChance(ship),
    lootStatus: {
      creditsTaken: Boolean(ship.ai.boardingLoot?.creditsTaken),
      cargoTaken: Boolean(ship.ai.boardingLoot?.cargoTaken)
    }
  };
};

const getBoardingData = (player, targetId) => {
  const ship = getBoardableShip(player, targetId);
  if (!ship) {
    return { ok: false, message: "No disabled ship in boarding range." };
  }
  return {
    ok: true,
    data: getBoardingPayload(ship)
  };
};

const triggerBoardingExplosion = (ship, player) => {
  removeAiShip(ship.id);
  appendLog(player, `${ship.name} detonated during boarding.`);
  return {
    id: ship.id,
    name: ship.name,
    systemId: ship.systemId,
    x: ship.x,
    y: ship.y,
    isAi: true
  };
};

const stealBoardingLoot = (player, targetId, lootType) => {
  const ship = getBoardableShip(player, targetId);
  if (!ship) {
    return { ok: false, message: "Boarding target lost.", closeBoarding: true };
  }
  if (!ship.ai.boardingLoot) {
    ship.ai.boardingLoot = { creditsTaken: false, cargoTaken: false };
  }
  const lootChance = getLootChance(ship);
  if (Math.random() > lootChance) {
    const destroyed = triggerBoardingExplosion(ship, player);
    return {
      ok: false,
      message: "Boarding failed. The target detonated.",
      closeBoarding: true,
      destroyed
    };
  }
  if (lootType === "credits") {
    if (ship.ai.boardingLoot.creditsTaken || ship.credits <= 0) {
      return { ok: false, message: "No credits left to steal." };
    }
    const stolenCredits = ship.credits;
    ship.credits = 0;
    ship.ai.boardingLoot.creditsTaken = true;
    player.credits += stolenCredits;
    appendLog(player, `Boarding success: stole ${stolenCredits} credits from ${ship.name}.`);
    return {
      ok: true,
      message: "Credits secured. Prepare to raid the cargo hold.",
      data: getBoardingPayload(ship)
    };
  }
  if (!ship.ai.boardingLoot.creditsTaken && ship.credits > 0) {
    return { ok: false, message: "Secure the credits before raiding the cargo." };
  }
  if (ship.ai.boardingLoot.cargoTaken || (ship.cargo || []).length === 0) {
    return { ok: false, message: "No cargo left to steal." };
  }
  (ship.cargo || []).forEach((entry) => {
    upsertCargo(player, entry.goodId, entry.quantity);
  });
  ship.cargo = [];
  ship.ai.boardingLoot.cargoTaken = true;
  appendLog(player, `Boarding success: transferred cargo from ${ship.name}.`);
  return {
    ok: true,
    message: "Cargo secured. Boarding team returning.",
    data: getBoardingPayload(ship)
  };
};

const captureShip = (player, targetId, decision) => {
  const ship = getBoardableShip(player, targetId);
  if (!ship) {
    return { ok: false, message: "Boarding target lost." };
  }
  const chance = getCaptureChance(ship);
  if (Math.random() > chance) {
    ship.ai.disabled = false;
    ship.ai.state = "exit";
    ship.ai.stateUntil = Date.now() + 7000;
    ship.ai.targetX = ship.x + Math.cos(ship.angle) * 900;
    ship.ai.targetY = ship.y + Math.sin(ship.angle) * 900;
    markShipHostileToPlayer(ship.id, player.id);
    return { ok: false, message: "Capture failed. Target re-engaging." };
  }
  if (decision === "takeover") {
    applyShipToPlayer(player, ship.ship);
    removeAiShip(ship.id);
    removeEscortFromPlayer(player, ship.id);
    appendLog(player, `Captured ${ship.name} and assumed control.`);
    return { ok: true, message: "Ship captured. You are now at the helm." };
  }
  const formationIndex = (player.escorts || []).length;
  assignShipAsEscort(ship, player.id, { formationIndex, hired: false, dailyRate: 0 });
  ship.ai.disabled = false;
  ship.ai.escortMode = "follow";
  if (!player.escorts) {
    player.escorts = [];
  }
  player.escorts.push({
    ...getEscortSummary(ship),
    mode: ship.ai.escortMode
  });
  moveEscortsToPlayer(player);
  appendLog(player, `Captured ${ship.name} and added it as an escort.`);
  return { ok: true, message: "Ship captured and assigned as escort." };
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
    const isDestroyed = applyDamageToTarget(target, damage);
    appendLog(target, `${player.name} hit you for ${damage} damage.`);
    appendLog(player, `You hit ${target.name} for ${damage} damage.`);
    if (isDestroyed) {
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

  getAiShips().forEach((target) => {
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
    const isDestroyed = applyDamageToTarget(target, damage);
    markShipHostileToPlayer(target.id, player.id);
    appendLog(player, `You hit ${target.name} for ${damage} damage.`);
    hits.push(target.id);
    if (isDestroyed) {
      destroyed.push({
        id: target.id,
        name: target.name,
        systemId: target.systemId,
        x: target.x,
        y: target.y,
        isAi: true
      });
      appendLog(player, `${target.name} was destroyed.`);
    }
  });

  return { hits, destroyed, weaponsFired: resolvedWeaponIds };
};

const fireTargetedWeapon = (player, payload, weaponId, options = {}) => {
  updatePosition(player, payload);
  const hits = [];
  const destroyed = [];
  const targetId = payload.targetId;
  const projectileId = options.projectileId || weaponId;
  if (!targetId) {
    return { hits, destroyed, weaponsFired: [], fired: false };
  }
  const damage = getWeaponDamage([weaponId]);
  if (damage <= 0) {
    return { hits, destroyed, weaponsFired: [], fired: false };
  }
  const targetPlayer = players.get(targetId);
  const targetAi = getAiShips().find((ship) => ship.id === targetId);
  const target = targetPlayer || targetAi;
  if (!target || target.systemId !== player.systemId || target.planetId) {
    return { hits, destroyed, weaponsFired: [projectileId], fired: true, targetId };
  }
  const range = options.range ?? 900;
  const distance = Math.hypot(target.x - player.x, target.y - player.y);
  if (distance > range) {
    return { hits, destroyed, weaponsFired: [projectileId], fired: true, targetId };
  }
  const isDestroyed = applyDamageToTarget(target, damage);
  if (targetPlayer) {
    appendLog(target, `${player.name} hit you for ${damage} damage.`);
    appendLog(player, `You hit ${target.name} for ${damage} damage.`);
  } else if (targetAi) {
    markShipHostileToPlayer(target.id, player.id);
    appendLog(player, `You hit ${target.name} for ${damage} damage.`);
  }
  hits.push(target.id);
  if (isDestroyed) {
    destroyed.push({
      id: target.id,
      name: target.name,
      systemId: target.systemId,
      x: target.x,
      y: target.y,
      isAi: Boolean(targetAi)
    });
    if (targetPlayer) {
      appendLog(target, "Ship destroyed! Rescue crews will tow you back once you relog.");
    }
    appendLog(player, `${target.name} was destroyed.`);
  }
  return { hits, destroyed, weaponsFired: [projectileId], fired: true, targetId };
};

const fireSecondaryWeapon = (player, payload) => {
  const weaponId = resolveSecondaryWeaponId(player, payload.secondaryWeaponId);
  if (!weaponId) {
    appendLog(player, "No secondary weapons installed.");
    return { hits: [], destroyed: [], weaponsFired: [], fired: false };
  }
  const weapon = weaponById.get(weaponId);
  if (!weapon) {
    appendLog(player, "Secondary weapon offline.");
    return { hits: [], destroyed: [], weaponsFired: [], fired: false };
  }
  if (weapon.requiresLock && !payload.targetId) {
    appendLog(player, "No target lock for that weapon.");
    return { hits: [], destroyed: [], weaponsFired: [], fired: false };
  }
  let damageWeaponId = weaponId;
  let projectileId = weapon.projectileId || weaponId;
  if (weapon.ammoType) {
    const ammoCount = getSecondaryAmmoCount(player, weapon.ammoType);
    if (ammoCount <= 0) {
      appendLog(player, `${weapon.name} out of ammo.`);
      return { hits: [], destroyed: [], weaponsFired: [], fired: false };
    }
    adjustSecondaryAmmo(player, weapon.ammoType, -1);
    damageWeaponId = weapon.ammoType;
    projectileId = weapon.projectileId || weapon.ammoType;
  }
  if (weapon.requiresLock) {
    return fireTargetedWeapon(player, payload, damageWeaponId, {
      range: weapon.range,
      projectileId
    });
  }
  const hitReport = fireWeapons(player, payload, [damageWeaponId], { allowFallback: false });
  return {
    hits: hitReport.hits,
    destroyed: hitReport.destroyed,
    weaponsFired: [projectileId],
    fired: true,
    targetId: payload.targetId || null
  };
};

module.exports = {
  addPlayer,
  removePlayer,
  getPlayer,
  getPlayerByName,
  getPlayers,
  persistPlayer,
  getPlayerState,
  getWorldState,
  getSystemStatus,
  getSystemStatusForSystem,
  tickAiShips,
  tickWorld,
  updatePosition,
  fireWeapons,
  fireSecondaryWeapon,
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
  getCargoUsed,
  getCargoCapacity,
  getEscortHireOffers,
  hireEscort,
  setEscortCommand,
  getBoardingData,
  stealBoardingLoot,
  captureShip,
  releaseEscort,
  removeEscortFromPlayer
};
