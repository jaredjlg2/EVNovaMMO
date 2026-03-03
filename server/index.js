const path = require("path");
const express = require("express");
const { WebSocketServer } = require("ws");
const logger = require("./logger");
const BALANCE = require("./game/balance");
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
  gambleAtBar,
  // Pillar 1
  ventHeatAction,
  setDistributionAction,
  // Pillar 2
  toggleCruiseAction,
  respondInterdictionAction,
  getInterdiction,
  // Pillar 3
  payBountyAction,
  getWantedLabel,
  // Pillar 4
  getWrecksForPlayer,
  scoopWreckAction,
  demandCargoAction,
  // Debug
  debugAddHeat,
  debugSetWanted,
  debugInterdict,
  debugSpawnPirate
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
  logger.info("EVNova MMO server started", { port });
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

// Send a message only to players currently in the given star system.
const broadcastToSystem = (systemId, payload) => {
  const message = JSON.stringify(payload);
  connections.forEach((socket, pid) => {
    const p = getPlayer(pid);
    if (p && p.systemId === systemId && socket.readyState === 1) {
      socket.send(message);
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
      broadcastToSystem(destroyed.systemId, { type: "destroyed", ...destroyed });
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
    broadcastToSystem(destroyed.systemId, { type: "destroyed", ...destroyed });
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
      broadcastToSystem(shot.systemId, { type: "fire", ...shot });
    });
  }
  if (tickReport?.destroyedPlayers?.length) {
    handleDestroyedEntities(tickReport.destroyedPlayers);
    // Broadcast any wrecks spawned from destroyed AI ships
    tickReport.destroyedPlayers.forEach((d) => {
      if (d.isAi && d.wreckId) {
        broadcastToSystem(d.systemId, {
          type: "wreckSpawned",
          wreckId: d.wreckId,
          x: d.x,
          y: d.y,
          systemId: d.systemId
        });
      }
    });
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
  // Pillar 2: Notify players of interdiction events
  if (tickReport?.interdictionEvents?.length) {
    const interdictionWindowSeconds = BALANCE.cruise.interdictionWindowSeconds;
    tickReport.interdictionEvents.forEach(({ playerId, tier }) => {
      const p = getPlayer(playerId);
      const s = connections.get(playerId);
      if (p && s) {
        sendTo(s, {
          type: "interdiction",
          tier,
          windowSeconds: interdictionWindowSeconds,
          message: `Interdiction field detected! Submit or evade within ${interdictionWindowSeconds} seconds.`
        });
        // Auto-resolve after window (server-side timeout)
        setTimeout(() => {
          const current = getPlayer(playerId);
          if (!current) return;
          const event = getInterdiction(playerId);
          if (event) {
            respondInterdictionAction(current, "submit");
            persistPlayer(current);
            const sock = connections.get(playerId);
            if (sock) {
              sendTo(sock, { type: "state", player: getPlayerState(current) });
              sendTo(sock, {
                type: "interdictionResult",
                result: "timeout",
                message: "Interdiction timeout. You were pulled out of cruise."
              });
            }
          }
        }, interdictionWindowSeconds * 1000 + 500);
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
    case "systemChat": {
      const chatMsg = `${action.message || ""}`.trim();
      if (!chatMsg) {
        shouldPersist = false;
        shouldBroadcast = false;
        return;
      }
      broadcastToSystem(player.systemId, {
        type: "systemChat",
        fromId: player.id,
        fromName: player.name,
        systemId: player.systemId,
        message: chatMsg
      });
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
        broadcastToSystem(outcome.destroyed.systemId, { type: "destroyed", ...outcome.destroyed });
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
      shouldPersist = hitReport.hits.length > 0 || hitReport.weaponsFired?.length > 0;
      break;
    case "fireSecondary":
      hitReport = fireSecondaryWeapon(player, action);
      shouldPersist = hitReport.fired || hitReport.hits.length > 0;
      break;
    // ─── PILLAR 1: Energy ───────────────────────────────────────────────
    case "ventHeat": {
      ventHeatAction(player);
      break;
    }
    case "setDistribution": {
      setDistributionAction(
        player,
        Number(action.wep ?? 33),
        Number(action.eng ?? 34),
        Number(action.sys ?? 33)
      );
      break;
    }
    // ─── PILLAR 2: Cruise ───────────────────────────────────────────────
    case "toggleCruise": {
      const cruiseResult = toggleCruiseAction(player);
      sendTo(socket, { type: "cruiseStatus", ...player.cruise, message: cruiseResult.message });
      break;
    }
    case "respondInterdiction": {
      const interdictResult = respondInterdictionAction(player, action.response || "submit");
      sendTo(socket, {
        type: "interdictionResult",
        ...interdictResult
      });
      break;
    }
    // ─── PILLAR 3: Bounty ───────────────────────────────────────────────
    case "payBounty": {
      payBountyAction(player, action.factionId);
      break;
    }
    // ─── PILLAR 4: Salvage ──────────────────────────────────────────────
    case "requestWrecks": {
      sendTo(socket, {
        type: "wrecks",
        wrecks: getWrecksForPlayer(player)
      });
      shouldPersist = false;
      shouldBroadcast = false;
      return;
    }
    case "scoopWreck": {
      const scoopResult = scoopWreckAction(player, action.wreckId, 0.1);
      sendTo(socket, { type: "scoopProgress", ...scoopResult });
      if (scoopResult.completed) {
        broadcastToSystem(player.systemId, {
          type: "wreckRemoved",
          wreckId: action.wreckId
        });
      }
      break;
    }
    case "demandCargo": {
      const demandResult = demandCargoAction(player, action.targetId);
      sendTo(socket, { type: "demandResult", ...demandResult });
      if (demandResult.ok) {
        const targetSock = connections.get(action.targetId);
        if (targetSock) {
          sendTo(targetSock, {
            type: "cargoDemand",
            fromId: player.id,
            fromName: player.name,
            message: `${player.name} is demanding your cargo! Comply (drop cargo) or fight.`
          });
        }
      }
      break;
    }
    // ─── Debug/Admin commands ────────────────────────────────────────────
    case "debugAddHeat": {
      debugAddHeat(player, action.amount);
      break;
    }
    case "debugSetWanted": {
      debugSetWanted(player, action.level);
      break;
    }
    case "debugInterdict": {
      debugInterdict(player);
      sendTo(socket, {
        type: "interdiction",
        tier: player.systemId,
        windowSeconds: 8,
        message: "[DEBUG] Interdiction triggered. Submit or evade."
      });
      break;
    }
    case "debugSpawnPirate": {
      debugSpawnPirate(player);
      break;
    }
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
    broadcastToSystem(player.systemId, {
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
        logger.info("Player connected", { playerId, name });
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
      logger.error("Invalid message", { err: error.message });
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
      logger.info("Player disconnected", { playerId });
    }
    broadcastPresence(true);
  });
});
