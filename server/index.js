const path = require("path");
const express = require("express");
const { WebSocketServer } = require("ws");
const {
  addPlayer,
  removePlayer,
  getPlayer,
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

const handleAction = (player, action, socket) => {
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
    default:
      break;
  }

  sendTo(socket, {
    type: "state",
    player: getPlayerState(player)
  });
  broadcast({ type: "presence", players: getSystemStatus() });
};

wss.on("connection", (socket) => {
  const id = Math.random().toString(36).slice(2, 9);
  const name = `Pilot-${id}`;
  const player = addPlayer({ id, name });

  sendTo(socket, {
    type: "init",
    player: getPlayerState(player),
    world: getWorldState(),
    players: getSystemStatus()
  });

  socket.on("message", (data) => {
    try {
      const action = JSON.parse(data.toString());
      const activePlayer = getPlayer(id);
      if (!activePlayer) {
        return;
      }
      handleAction(activePlayer, action, socket);
    } catch (error) {
      console.error("Invalid message", error);
    }
  });

  socket.on("close", () => {
    removePlayer(id);
    broadcast({ type: "presence", players: getSystemStatus() });
  });
});
