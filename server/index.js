const path = require("path");
const express = require("express");
const { WebSocketServer } = require("ws");
const {
  addPlayer,
  removePlayer,
  getPlayer,
  getPlayerByName,
  getPlayerState,
  getWorldState,
  getSystemStatus,
  persistPlayer,
  updatePosition,
  fireWeapons,
  tickAiShips,
  jumpSystem,
  dockPlanet,
  undock,
  buyWeapon,
  buyOutfit,
  buyShip,
  acceptMission,
  completeMissions,
  getAvailableMissions
} = require("./game/game");

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
const aiTickIntervalMs = 200;

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

setInterval(() => {
  tickAiShips(aiTickIntervalMs / 1000);
  if (wss.clients.size > 0) {
    broadcast({ type: "presence", players: getSystemStatus() });
  }
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
      dockPlanet(player, action.planetId);
      break;
    case "undock":
      undock(player);
      break;
    case "buyWeapon":
      buyWeapon(player, action.weaponId);
      break;
    case "buyOutfit":
      buyOutfit(player, action.outfitId);
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
    case "requestMissions":
      sendTo(socket, {
        type: "missions",
        missions: getAvailableMissions(player.planetId)
      });
      return;
    case "position":
      updatePosition(player, action);
      shouldPersist = false;
      break;
    case "fire":
      hitReport = fireWeapons(player, action);
      shouldPersist = hitReport.hits.length > 0;
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

  if (action.type === "fire") {
    broadcast({
      type: "fire",
      shooterId: player.id,
      systemId: player.systemId,
      x: player.x,
      y: player.y,
      angle: player.angle,
      weapons: player.weapons
    });
  }

  if (hitReport.destroyed.length > 0) {
    hitReport.destroyed.forEach((destroyed) => {
      const destroyedPlayer = getPlayer(destroyed.id);
      if (destroyedPlayer) {
        destroyedPlayer.hull = destroyedPlayer.ship.hull;
        destroyedPlayer.shield = destroyedPlayer.ship.shield;
        destroyedPlayer.x = 0;
        destroyedPlayer.y = 0;
        destroyedPlayer.planetId = null;
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
  }

  if (shouldBroadcast) {
    broadcast({ type: "presence", players: getSystemStatus() });
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
        broadcast({ type: "presence", players: getSystemStatus() });
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
        persistPlayer(existingPlayer);
      }
      removePlayer(playerId);
      connections.delete(playerId);
    }
    broadcast({ type: "presence", players: getSystemStatus() });
  });
});
