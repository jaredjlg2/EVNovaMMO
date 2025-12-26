const connectionEl = document.getElementById("connection");
const creditsEl = document.getElementById("credits");
const pilotNameDisplayEl = document.getElementById("pilotNameDisplay");
const mapEl = document.getElementById("map");
const systemInfoEl = document.getElementById("systemInfo");
const planetListEl = document.getElementById("planetList");
const shipInfoEl = document.getElementById("shipInfo");
const weaponListEl = document.getElementById("weaponList");
const outfitListEl = document.getElementById("outfitList");
const missionBoardEl = document.getElementById("missionBoard");
const presenceEl = document.getElementById("presence");
const logEl = document.getElementById("log");
const flightCanvas = document.getElementById("flightCanvas");
const flightStatusEl = document.getElementById("flightStatus");

const loginOverlayEl = document.getElementById("loginOverlay");
const loginFormEl = document.getElementById("loginForm");
const pilotNameInputEl = document.getElementById("pilotName");
const loginErrorEl = document.getElementById("loginError");
const loginHintEl = document.getElementById("loginHint");

const undockBtn = document.getElementById("undockBtn");
const completeBtn = document.getElementById("completeBtn");

let world = null;
let player = null;
let presence = [];
let socket = null;
let isLoggedIn = false;

const storedPilotKey = "evnova_pilots";
const maxStoredPilots = 5;

const flightState = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  lastFrame: performance.now()
};

const keysPressed = new Set();

const starField = {
  width: 1600,
  height: 1000,
  stars: Array.from({ length: 160 }, () => ({
    x: Math.random() * 1600,
    y: Math.random() * 1000,
    size: Math.random() * 1.8 + 0.6,
    alpha: Math.random() * 0.6 + 0.3
  }))
};

const sendAction = (payload) => {
  if (!socket || socket.readyState !== 1) {
    return;
  }
  socket.send(JSON.stringify(payload));
};

const formatCredits = (value) => `${value.toLocaleString()} cr`;

const loadStoredPilots = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(storedPilotKey) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    return [];
  }
};

const saveStoredPilot = (name) => {
  const stored = loadStoredPilots().filter((pilot) => pilot !== name);
  stored.unshift(name);
  localStorage.setItem(storedPilotKey, JSON.stringify(stored.slice(0, maxStoredPilots)));
};

const renderPilotHints = () => {
  const stored = loadStoredPilots();
  loginHintEl.innerHTML = "";
  if (stored.length === 0) {
    loginHintEl.textContent = "No saved pilots yet. Create a new call sign to begin.";
    return;
  }
  const label = document.createElement("div");
  label.textContent = "Recent pilots:";
  loginHintEl.appendChild(label);
  const list = document.createElement("div");
  list.className = "pilot-list";
  stored.forEach((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pilot-chip";
    button.textContent = name;
    button.addEventListener("click", () => {
      pilotNameInputEl.value = name;
    });
    list.appendChild(button);
  });
  loginHintEl.appendChild(list);
};

const showLoginOverlay = (message = "") => {
  loginOverlayEl.classList.remove("hidden");
  loginErrorEl.textContent = message;
  flightStatusEl.textContent = "Awaiting login…";
  renderPilotHints();
};

const hideLoginOverlay = () => {
  loginOverlayEl.classList.add("hidden");
};

const wrapOffset = (value, size) => ((value % size) + size) % size;

const resizeFlightCanvas = () => {
  const { clientWidth, clientHeight } = flightCanvas;
  if (flightCanvas.width !== clientWidth || flightCanvas.height !== clientHeight) {
    flightCanvas.width = clientWidth;
    flightCanvas.height = clientHeight;
  }
};

const updateFlight = (deltaSeconds) => {
  if (!player || !isLoggedIn) {
    return;
  }
  const docked = Boolean(player.planetId);
  const acceleration = docked ? 0 : 180;
  const drag = docked ? 0.8 : 0.92;
  const maxSpeed = docked ? 0 : 260;

  let inputX = 0;
  let inputY = 0;
  if (!docked) {
    if (keysPressed.has("ArrowUp") || keysPressed.has("w")) inputY -= 1;
    if (keysPressed.has("ArrowDown") || keysPressed.has("s")) inputY += 1;
    if (keysPressed.has("ArrowLeft") || keysPressed.has("a")) inputX -= 1;
    if (keysPressed.has("ArrowRight") || keysPressed.has("d")) inputX += 1;
  }

  if (inputX !== 0 || inputY !== 0) {
    const length = Math.hypot(inputX, inputY) || 1;
    flightState.vx += (inputX / length) * acceleration * deltaSeconds;
    flightState.vy += (inputY / length) * acceleration * deltaSeconds;
  }

  flightState.vx *= drag;
  flightState.vy *= drag;

  const speed = Math.hypot(flightState.vx, flightState.vy);
  if (speed > maxSpeed && maxSpeed > 0) {
    const scale = maxSpeed / speed;
    flightState.vx *= scale;
    flightState.vy *= scale;
  }

  if (docked) {
    flightState.vx = 0;
    flightState.vy = 0;
  }

  flightState.x += flightState.vx * deltaSeconds;
  flightState.y += flightState.vy * deltaSeconds;
};

const renderFlight = (now) => {
  const ctx = flightCanvas.getContext("2d");
  resizeFlightCanvas();
  const deltaSeconds = Math.min((now - flightState.lastFrame) / 1000, 0.05);
  flightState.lastFrame = now;
  updateFlight(deltaSeconds);

  const { width, height } = flightCanvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#070b18";
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;

  starField.stars.forEach((star) => {
    const offsetX =
      wrapOffset(star.x - flightState.x + starField.width / 2, starField.width) -
      starField.width / 2;
    const offsetY =
      wrapOffset(star.y - flightState.y + starField.height / 2, starField.height) -
      starField.height / 2;
    const x = centerX + offsetX;
    const y = centerY + offsetY;
    if (x < -20 || x > width + 20 || y < -20 || y > height + 20) {
      return;
    }
    ctx.fillStyle = `rgba(200, 220, 255, ${star.alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  if (player && isLoggedIn) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.fillStyle = "#8bd4ff";
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(10, 10);
    ctx.lineTo(0, 6);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (!player || !isLoggedIn) {
    flightStatusEl.textContent = "Awaiting login…";
  } else if (player.planetId) {
    const planetName =
      world?.planets.find((planet) => planet.id === player.planetId)?.name || "Unknown";
    flightStatusEl.textContent = `Docked at ${planetName}. Engines offline.`;
  } else {
    const speed = Math.hypot(flightState.vx, flightState.vy).toFixed(1);
    const systemName =
      world?.systems.find((system) => system.id === player.systemId)?.name || player.systemId;
    flightStatusEl.textContent = `Cruising in ${systemName} · Velocity ${speed} u/s`;
  }

  requestAnimationFrame(renderFlight);
};

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
  pilotNameDisplayEl.textContent = player.name ? `Pilot: ${player.name}` : "";
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
    isLoggedIn = false;
    player = null;
    pilotNameDisplayEl.textContent = "";
    showLoginOverlay("Connection lost. Please reconnect.");
  });

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === "loginRequired") {
      showLoginOverlay();
      return;
    }
    if (payload.type === "loginError") {
      showLoginOverlay(payload.message);
      return;
    }
    if (payload.type === "init") {
      world = payload.world;
      player = payload.player;
      presence = payload.players;
      isLoggedIn = true;
      saveStoredPilot(player.name);
      hideLoginOverlay();
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

loginFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = pilotNameInputEl.value.trim();
  if (!name) {
    loginErrorEl.textContent = "Please enter a pilot call sign.";
    return;
  }
  if (!socket || socket.readyState !== 1) {
    loginErrorEl.textContent = "Connection not ready. Try again in a moment.";
    return;
  }
  loginErrorEl.textContent = "";
  sendAction({ type: "login", name });
});

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) {
    keysPressed.add(event.key);
  }
});

window.addEventListener("keyup", (event) => {
  keysPressed.delete(event.key);
});

window.addEventListener("resize", () => {
  resizeFlightCanvas();
});

connect();
renderPilotHints();
requestAnimationFrame(renderFlight);
