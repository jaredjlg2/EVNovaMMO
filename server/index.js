const path = require("path");
const express = require("express");
const { WebSocketServer } = require("ws");
const {
  addPlayer,
  removePlayer,
  getPlayer,
  getPlayerByName,
  getPlayers,
  getPlayerState,
  getWorldState,
  getSystemStatus,
  getSystemStatusForSystem,
  persistPlayer,
  updatePosition,
  fireWeapons,
  fireSecondaryWeapon,
  tickWorld,
  jumpSystem,
  dockPlanet,
  undock,
  buyWeapon,
  sellWeapon,
  buyOutfit,
  sellOutfit,
  buyShip,
  acceptMission,
  completeMissions,
  getAvailableMissions,
  getMarketForPlanet,
  buyGoods,
  sellGoods,
  getEscortHireOffers,
  hireEscort,
  setEscortCommand,
  getBoardingData,
  stealBoardingLoot,
  captureShip,
  removeEscortFromPlayer,
  releaseEscort,
  gambleAtBar
} = require("./game/game");
const { removeAiShip } = require("./game/ai");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "client")));

app.get("/api/world", (req, res) => {
  res.json({ world: getWorldState() });
});

app.get("/api/status", (req, res) => {
  res.json({ players: getSystemStatus() });
});

const server = app.listen(port, () => {
  console.log(`EVNova MMO server running on ${port}`);
});

const wss = new WebSocketServer({ server });
const connections = new Map();
const aiTickIntervalMs = 20;
let lastAiTick = Date.now();
const presenceBroadcastIntervalMs = 40;
let lastPresenceBroadcast = 0;
const persistenceIntervalMs = 5000;

const broadcast = (payload) => {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
};

const sendTo = (socket, payload) => {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(payload));
  }
};

const broadcastPresence = (force = false) => {
  const now = Date.now();
  if (!force && now - lastPresenceBroadcast < presenceBroadcastIntervalMs) {
    return;
  }
  lastPresenceBroadcast = now;
  if (connections.size === 0) {
    return;
  }
  connections.forEach((socket, playerId) => {
    const player = getPlayer(playerId);
    if (!player) {
      return;
    }
    sendTo(socket, {
      type: "presence",
      players: getSystemStatusForSystem(player.systemId)
    });
  });
};

const handleDestroyedEntities = (destroyedList) => {
  destroyedList.forEach((destroyed) => {
    if (destroyed.isAi) {
      const removedShip = removeAiShip(destroyed.id);
      if (removedShip?.ai?.ownerId) {
        const owner = getPlayer(removedShip.ai.ownerId);
        if (owner) {
          removeEscortFromPlayer(owner, removedShip.id);
          persistPlayer(owner);
        }
      }
      broadcast({ type: "destroyed", ...destroyed });
      return;
    }
    const destroyedPlayer = getPlayer(destroyed.id);
    if (destroyedPlayer) {
      destroyedPlayer.hull = destroyedPlayer.ship.hull;
      destroyedPlayer.shield = destroyedPlayer.ship.shield;
      destroyedPlayer.x = 0;
      destroyedPlayer.y = 0;
      destroyedPlayer.planetId = null;
      (destroyedPlayer.escorts || []).forEach((escort) => {
        removeAiShip(escort.id);
      });
      destroyedPlayer.escorts = [];
      persistPlayer(destroyedPlayer);
    }
    const destroyedSocket = connections.get(destroyed.id);
    if (destroyedSocket) {
      sendTo(destroyedSocket, { type: "destroyed", ...destroyed });
      sendTo(destroyedSocket, {
        type: "loginRequired",
        message: "Ship destroyed. Re-login to respawn."
      });
    }
    removePlayer(destroyed.id);
    connections.delete(destroyed.id);
    broadcast({ type: "destroyed", ...destroyed });
  });
};

setInterval(() => {
  getPlayers().forEach((player) => {
    persistPlayer(player);
  });
}, persistenceIntervalMs);

setInterval(() => {
  const now = Date.now();
  let deltaSeconds = (now - lastAiTick) / 1000;
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    deltaSeconds = aiTickIntervalMs / 1000;
  } else if (deltaSeconds > 0.5) {
    deltaSeconds = 0.5;
  }
  lastAiTick = now;
  const tickReport = tickWorld(deltaSeconds);
  if (tickReport?.aiShots?.length) {
    tickReport.aiShots.forEach((shot) => {
      broadcast({ type: "fire", ...shot });
    });
  }
  if (tickReport?.destroyedPlayers?.length) {
    handleDestroyedEntities(tickReport.destroyedPlayers);
  }
  if (tickReport?.hitPlayers?.length) {
    tickReport.hitPlayers.forEach((hitId) => {
      const hitPlayer = getPlayer(hitId);
      const hitSocket = connections.get(hitId);
      if (hitPlayer && hitSocket) {
        persistPlayer(hitPlayer);
        sendTo(hitSocket, { type: "state", player: getPlayerState(hitPlayer) });
      }
    });
  }
  broadcastPresence();
}, aiTickIntervalMs);

const handleAction = (player, action, socket) => {
  let shouldPersist = true;
  let shouldBroadcast = true;
  let hitReport = { hits: [], destroyed: [] };

  switch (action.type) {
    case "jump":
      jumpSystem(player, action.systemId);
      break;
    case "dock":
      {
        const previousPlanetId = player.planetId;
        dockPlanet(player, action.planetId);
        if (player.planetId && player.planetId !== previousPlanetId) {
          completeMissions(player);
        }
      }
      break;
    case "undock":
      undock(player);
      break;
    case "buyWeapon":
      buyWeapon(player, action.weaponId);
      break;
    case "sellWeapon":
      sellWeapon(player, action.weaponId);
      break;
    case "buyOutfit":
      buyOutfit(player, action.outfitId);
      break;
    case "sellOutfit":
      sellOutfit(player, action.outfitId);
      break;
    case "buyShip":
      buyShip(player, action.shipId);
      break;
    case "acceptMission":
      acceptMission(player, action.missionId);
      break;
    case "completeMissions":
      completeMissions(player);
      break;
    case "buyGoods":
      buyGoods(player, action.goodId, action.quantity);
      break;
    case "sellGoods":
      sellGoods(player, action.goodId, action.quantity);
      break;
    case "requestBar":
      sendTo(socket, {
        type: "bar",
        escortsForHire: player.planetId ? getEscortHireOffers(player.planetId) : [],
        currentEscorts: player.escorts || []
      });
      return;
    case "hireEscort":
      hireEscort(player, action.shipId);
      break;
    case "escortCommand":
      setEscortCommand(player, action.command, action.targetId || null);
      break;
    case "releaseEscort":
      releaseEscort(player, action.escortId);
      break;
    case "gamble":
      gambleAtBar(player);
      break;
    case "commsMessage": {
      const targetId = action.targetId;
      const message = `${action.message || ""}`.trim();
      if (!targetId || !message) {
        shouldPersist = false;
        shouldBroadcast = false;
        return;
      }
      const targetPlayer = getPlayer(targetId);
      if (!targetPlayer) {
        shouldPersist = false;
        shouldBroadcast = false;
        return;
      }
      const targetSocket = connections.get(targetId);
      if (targetSocket) {
        sendTo(targetSocket, {
          type: "commsMessage",
          fromId: player.id,
          fromName: player.name,
          message
        });
      }
      shouldPersist = false;
      shouldBroadcast = false;
      break;
    }
    case "boardShip": {
      const report = getBoardingData(player, action.targetId);
      if (!report.ok) {
        sendTo(socket, { type: "boardingResult", success: false, message: report.message });
        shouldPersist = false;
        shouldBroadcast = false;
        return;
      }
      sendTo(socket, { type: "boarding", ...report.data });
      shouldPersist = false;
      shouldBroadcast = false;
      return;
    }
    case "stealBoardingLoot": {
      const outcome = stealBoardingLoot(player, action.targetId, action.lootType);
      if (outcome.destroyed) {
        broadcast({ type: "destroyed", ...outcome.destroyed });
      }
      if (outcome.data) {
        sendTo(socket, {
          type: "boardingUpdate",
          message: outcome.message || "",
          ...outcome.data
        });
        break;
      }
      sendTo(socket, {
        type: "boardingResult",
        success: outcome.ok,
        message: outcome.message,
        closeBoarding: outcome.closeBoarding || false
      });
      break;
    }
    case "captureShip": {
      const outcome = captureShip(player, action.targetId, action.decision);
      sendTo(socket, {
        type: "boardingResult",
        success: outcome.ok,
        message: outcome.message
      });
      break;
    }
    case "requestMissions":
      sendTo(socket, {
        type: "missions",
        missions: getAvailableMissions(player)
      });
      return;
    case "requestMarket":
      sendTo(socket, {
        type: "market",
        market: getMarketForPlanet(player.planetId)
      });
      return;
    case "position":
      updatePosition(player, action);
      shouldPersist = false;
      shouldBroadcast = false;
      break;
    case "fire":
      hitReport = fireWeapons(player, action, player.weapons, { allowFallback: true });
      shouldPersist = hitReport.hits.length > 0;
      break;
    case "fireSecondary":
      hitReport = fireSecondaryWeapon(player, action);
      shouldPersist = hitReport.fired || hitReport.hits.length > 0;
      break;
    default:
      break;
  }

  if (shouldPersist) {
    persistPlayer(player);
  }

  sendTo(socket, {
    type: "state",
    player: getPlayerState(player)
  });

  if (
    (action.type === "fire" || action.type === "fireSecondary") &&
    hitReport.weaponsFired.length > 0
  ) {
    broadcast({
      type: "fire",
      shooterId: player.id,
      systemId: player.systemId,
      x: player.x,
      y: player.y,
      angle: player.angle,
      weapons: hitReport.weaponsFired,
      targetId: hitReport.targetId || null
    });
  }

  if (hitReport.destroyed.length > 0) {
    handleDestroyedEntities(hitReport.destroyed);
  }

  if (shouldBroadcast) {
    broadcastPresence();
  }

  if (hitReport.hits.length > 0) {
    const destroyedIds = new Set(hitReport.destroyed.map((entry) => entry.id));
    hitReport.hits.forEach((hitId) => {
      if (destroyedIds.has(hitId)) {
        return;
      }
      const hitPlayer = getPlayer(hitId);
      const hitSocket = connections.get(hitId);
      if (hitPlayer && hitSocket) {
        persistPlayer(hitPlayer);
        sendTo(hitSocket, { type: "state", player: getPlayerState(hitPlayer) });
      }
    });
  }
};

wss.on("connection", (socket) => {
  let playerId = null;

  sendTo(socket, { type: "loginRequired" });

  socket.on("message", (data) => {
    try {
      const action = JSON.parse(data.toString());
      if (action.type === "login") {
        const name = `${action.name || ""}`.trim();
        if (!name) {
          sendTo(socket, { type: "loginError", message: "Pilot name is required." });
          return;
        }
        if (getPlayerByName(name)) {
          sendTo(socket, {
            type: "loginError",
            message: "Pilot already logged in. Choose another call sign."
          });
          return;
        }
        playerId = Math.random().toString(36).slice(2, 9);
        const player = addPlayer({ id: playerId, name });
        connections.set(playerId, socket);
        persistPlayer(player);
        sendTo(socket, {
          type: "init",
          player: getPlayerState(player),
          world: getWorldState(),
          players: getSystemStatus()
        });
        broadcastPresence(true);
        return;
      }

      if (!playerId) {
        sendTo(socket, { type: "loginError", message: "Please log in first." });
        return;
      }

      const activePlayer = getPlayer(playerId);
      if (!activePlayer) {
        return;
      }
      handleAction(activePlayer, action, socket);
    } catch (error) {
      console.error("Invalid message", error);
    }
  });

  socket.on("close", () => {
    if (playerId) {
      const existingPlayer = getPlayer(playerId);
      if (existingPlayer) {
        (existingPlayer.escorts || []).forEach((escort) => {
          removeAiShip(escort.id);
        });
        existingPlayer.escorts = [];
        persistPlayer(existingPlayer);
      }
      removePlayer(playerId);
      connections.delete(playerId);
    }
    broadcastPresence(true);
  });
});
