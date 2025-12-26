const connectionEl = document.getElementById("connection");
const creditsEl = document.getElementById("credits");
const mapEl = document.getElementById("map");
const systemInfoEl = document.getElementById("systemInfo");
const planetListEl = document.getElementById("planetList");
const shipInfoEl = document.getElementById("shipInfo");
const weaponListEl = document.getElementById("weaponList");
const outfitListEl = document.getElementById("outfitList");
const missionBoardEl = document.getElementById("missionBoard");
const presenceEl = document.getElementById("presence");
const logEl = document.getElementById("log");

const undockBtn = document.getElementById("undockBtn");
const completeBtn = document.getElementById("completeBtn");

let world = null;
let player = null;
let presence = [];
let socket = null;

const sendAction = (payload) => {
  if (!socket || socket.readyState !== 1) {
    return;
  }
  socket.send(JSON.stringify(payload));
};

const formatCredits = (value) => `${value.toLocaleString()} cr`;

const renderMap = () => {
  if (!world) {
    return;
  }
  mapEl.innerHTML = "";
  const minX = Math.min(...world.systems.map((system) => system.x));
  const minY = Math.min(...world.systems.map((system) => system.y));
  const maxX = Math.max(...world.systems.map((system) => system.x));
  const maxY = Math.max(...world.systems.map((system) => system.y));

  const padding = 40;
  const width = mapEl.clientWidth - padding * 2;
  const height = mapEl.clientHeight - padding * 2;

  const normalize = (value, min, max, size) =>
    ((value - min) / (max - min || 1)) * size + padding;

  const positionCache = new Map();
  world.systems.forEach((system) => {
    const x = normalize(system.x, minX, maxX, width);
    const y = normalize(system.y, minY, maxY, height);
    positionCache.set(system.id, { x, y });
  });

  world.systems.forEach((system) => {
    system.links.forEach((linkId) => {
      const target = positionCache.get(linkId);
      const source = positionCache.get(system.id);
      if (!target || !source) {
        return;
      }
      if (system.id > linkId) {
        return;
      }
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const line = document.createElement("div");
      line.className = "map-line";
      line.style.left = `${source.x}px`;
      line.style.top = `${source.y}px`;
      line.style.width = `${length}px`;
      line.style.transform = `rotate(${angle}deg)`;
      mapEl.appendChild(line);
    });
  });

  world.systems.forEach((system) => {
    const { x, y } = positionCache.get(system.id);
    const dot = document.createElement("div");
    dot.className = "system-dot";
    if (player?.systemId === system.id) {
      dot.classList.add("active");
    }
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.title = `Jump to ${system.name}`;
    dot.addEventListener("click", () => {
      if (player?.systemId === system.id) {
        return;
      }
      sendAction({ type: "jump", systemId: system.id });
    });
    const label = document.createElement("div");
    label.className = "system-label";
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    label.textContent = system.name;
    mapEl.appendChild(dot);
    mapEl.appendChild(label);
  });
};

const renderSystemInfo = () => {
  if (!player || !world) {
    return;
  }
  const system = world.systems.find((item) => item.id === player.systemId);
  const currentPlanet = world.planets.find((item) => item.id === player.planetId);
  systemInfoEl.innerHTML = `
    <div class="list-item">
      <h4>${system?.name ?? "Unknown"}</h4>
      <p>Location: ${player.planetId ? `Docked at ${currentPlanet?.name}` : "In open space"}</p>
      <p>Links: ${(system?.links || []).map((id) => world.systems.find((s) => s.id === id)?.name).join(", ")}</p>
    </div>
  `;
};

const renderPlanets = () => {
  if (!player || !world) {
    return;
  }
  const planets = world.planets.filter((planet) => planet.systemId === player.systemId);
  planetListEl.innerHTML = "";
  planets.forEach((planet) => {
    const card = document.createElement("div");
    card.className = "list-item";
    card.innerHTML = `
      <h4>${planet.name}</h4>
      <p>${planet.outfitter ? "Outfitter" : "No outfitter"} · ${planet.shipyard ? "Shipyard" : "No shipyard"}</p>
      <p>${planet.missionBoard ? "Mission Board" : "No missions"}</p>
    `;
    const dockBtn = document.createElement("button");
    dockBtn.textContent = player.planetId === planet.id ? "Docked" : "Dock";
    dockBtn.disabled = player.planetId === planet.id;
    dockBtn.addEventListener("click", () => {
      sendAction({ type: "dock", planetId: planet.id });
    });
    card.appendChild(dockBtn);
    planetListEl.appendChild(card);
  });
};

const renderShip = () => {
  if (!player) {
    return;
  }
  const { ship } = player;
  shipInfoEl.innerHTML = `
    <div class="list-item">
      <h4>${ship.name}</h4>
      <p>Hull: ${ship.hull} · Shield: ${ship.shield}</p>
      <p>Cargo: ${ship.cargo} · Fuel: ${ship.fuel}</p>
      <p>Hardpoints: ${player.weapons.length}/${ship.hardpoints}</p>
    </div>
  `;
};

const renderWeapons = () => {
  if (!player || !world) {
    return;
  }
  weaponListEl.innerHTML = "";
  world.weapons.forEach((weapon) => {
    const card = document.createElement("div");
    card.className = "list-item";
    card.innerHTML = `
      <h4>${weapon.name}</h4>
      <p>Damage: ${weapon.damage} · Energy: ${weapon.energyCost}</p>
      <p>${formatCredits(weapon.price)}</p>
      <p>Installed: ${player.weapons.filter((id) => id === weapon.id).length}</p>
    `;
    const buyBtn = document.createElement("button");
    buyBtn.textContent = "Buy";
    buyBtn.addEventListener("click", () => {
      sendAction({ type: "buyWeapon", weaponId: weapon.id });
    });
    card.appendChild(buyBtn);
    weaponListEl.appendChild(card);
  });
};

const renderOutfits = () => {
  if (!player || !world) {
    return;
  }
  outfitListEl.innerHTML = "";
  world.outfits.forEach((outfit) => {
    const card = document.createElement("div");
    card.className = "list-item";
    card.innerHTML = `
      <h4>${outfit.name}</h4>
      <p>${outfit.effect}</p>
      <p>${formatCredits(outfit.price)}</p>
      <p>Installed: ${player.outfits.filter((id) => id === outfit.id).length}</p>
    `;
    const buyBtn = document.createElement("button");
    buyBtn.textContent = "Install";
    buyBtn.addEventListener("click", () => {
      sendAction({ type: "buyOutfit", outfitId: outfit.id });
    });
    card.appendChild(buyBtn);
    outfitListEl.appendChild(card);
  });
};

const renderMissions = (missions) => {
  if (!missions || !world) {
    return;
  }
  missionBoardEl.innerHTML = "";
  missions.forEach((mission) => {
    const card = document.createElement("div");
    card.className = "list-item";
    const from = world.planets.find((planet) => planet.id === mission.fromPlanetId);
    const to = world.planets.find((planet) => planet.id === mission.toPlanetId);
    card.innerHTML = `
      <h4>${mission.title}</h4>
      <p>${mission.description}</p>
      <p>${from?.name ?? "Unknown"} → ${to?.name ?? "Unknown"}</p>
      <p>Reward: ${formatCredits(mission.reward)}</p>
    `;
    const acceptBtn = document.createElement("button");
    acceptBtn.textContent = "Accept";
    acceptBtn.addEventListener("click", () => {
      sendAction({ type: "acceptMission", missionId: mission.id });
    });
    card.appendChild(acceptBtn);
    missionBoardEl.appendChild(card);
  });
};

const renderPresence = () => {
  presenceEl.innerHTML = "";
  presence.forEach((pilot) => {
    const card = document.createElement("div");
    card.className = "list-item";
    const systemName = world?.systems.find((system) => system.id === pilot.systemId)?.name ?? "Unknown";
    const planetName = world?.planets.find((planet) => planet.id === pilot.planetId)?.name;
    card.innerHTML = `
      <h4>${pilot.name}</h4>
      <p>${systemName}${planetName ? ` · Docked at ${planetName}` : ""}</p>
      <p>${pilot.ship.name}</p>
    `;
    presenceEl.appendChild(card);
  });
};

const renderLog = () => {
  if (!player) {
    return;
  }
  logEl.innerHTML = "";
  player.log.forEach((entry) => {
    const line = document.createElement("div");
    line.textContent = entry;
    logEl.appendChild(line);
  });
};

const refreshUi = () => {
  if (!player) {
    return;
  }
  creditsEl.textContent = formatCredits(player.credits);
  renderMap();
  renderSystemInfo();
  renderPlanets();
  renderShip();
  renderWeapons();
  renderOutfits();
  renderPresence();
  renderLog();
  if (player.planetId) {
    sendAction({ type: "requestMissions" });
  } else {
    missionBoardEl.innerHTML = "<p>Dock to access mission boards.</p>";
  }
};

const connect = () => {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  socket = new WebSocket(`${protocol}://${location.host}`);

  socket.addEventListener("open", () => {
    connectionEl.textContent = "Connected";
  });

  socket.addEventListener("close", () => {
    connectionEl.textContent = "Disconnected";
  });

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === "init") {
      world = payload.world;
      player = payload.player;
      presence = payload.players;
      refreshUi();
      return;
    }
    if (payload.type === "state") {
      player = payload.player;
      refreshUi();
      return;
    }
    if (payload.type === "presence") {
      presence = payload.players;
      renderPresence();
      return;
    }
    if (payload.type === "missions") {
      renderMissions(payload.missions);
    }
  });
};

undockBtn.addEventListener("click", () => {
  sendAction({ type: "undock" });
});

completeBtn.addEventListener("click", () => {
  sendAction({ type: "completeMissions" });
});

connect();
