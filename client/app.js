const connectionEl = document.getElementById("connection");
const creditsEl = document.getElementById("credits");
const pilotNameDisplayEl = document.getElementById("pilotNameDisplay");
const systemNameEl = document.getElementById("systemName");
const shipInfoEl = document.getElementById("shipInfo");
const weaponListEl = document.getElementById("weaponList");
const outfitListEl = document.getElementById("outfitList");
const missionBoardEl = document.getElementById("missionBoard");
const dockedPanelEl = document.getElementById("dockedPanel");
const dockedInfoEl = document.getElementById("dockedInfo");
const logEl = document.getElementById("log");
const flightCanvas = document.getElementById("flightCanvas");
const flightStatusEl = document.getElementById("flightStatus");
const dockPromptEl = document.getElementById("dockPrompt");
const weaponStatusEl = document.getElementById("weaponStatus");

const loginOverlayEl = document.getElementById("loginOverlay");
const loginFormEl = document.getElementById("loginForm");
const pilotNameInputEl = document.getElementById("pilotName");
const loginErrorEl = document.getElementById("loginError");
const loginHintEl = document.getElementById("loginHint");

const undockBtn = document.getElementById("undockBtn");
const completeBtn = document.getElementById("completeBtn");

let world = null;
let player = null;
let socket = null;
let isLoggedIn = false;
let weaponStatusTimeout = null;
let currentDockingTarget = null;
let planetPositions = new Map();

const storedPilotKey = "evnova_pilots";
const maxStoredPilots = 5;
const dockingRange = 70;

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

const buildPlanetPositions = () => {
  planetPositions = new Map();
  if (!world) {
    return;
  }
  world.systems.forEach((system) => {
    const planets = world.planets.filter((planet) => planet.systemId === system.id);
    if (planets.length === 0) {
      return;
    }
    const step = (Math.PI * 2) / planets.length;
    planets.forEach((planet, index) => {
      const radius = 220 + (index % 2) * 90;
      const angle = index * step - Math.PI / 2;
      planetPositions.set(planet.id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        radius: 28,
        glow: 8 + (index % 2) * 4
      });
    });
  });
};

const getPlanetsInSystem = (systemId) =>
  world?.planets.filter((planet) => planet.systemId === systemId) ?? [];

const getCurrentPlanet = () =>
  world?.planets.find((planet) => planet.id === player?.planetId) ?? null;

const updateFlight = (deltaSeconds) => {
  if (!player || !isLoggedIn) {
    return;
  }
  const docked = Boolean(player.planetId);
  const acceleration = docked ? 0 : 200;
  const drag = docked ? 0.8 : 0.92;
  const maxSpeed = docked ? 0 : 280;

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

const updateDockingTarget = () => {
  if (!player || !world || player.planetId) {
    currentDockingTarget = null;
    dockPromptEl.textContent = "";
    return;
  }
  const planets = getPlanetsInSystem(player.systemId);
  let closest = null;
  planets.forEach((planet) => {
    const position = planetPositions.get(planet.id);
    if (!position) {
      return;
    }
    const distance = Math.hypot(flightState.x - position.x, flightState.y - position.y);
    if (!closest || distance < closest.distance) {
      closest = { planet, distance };
    }
  });
  currentDockingTarget = closest;
  if (!closest) {
    dockPromptEl.textContent = "";
    return;
  }
  if (closest.distance <= dockingRange) {
    dockPromptEl.textContent = `Press L to dock at ${closest.planet.name}.`;
  } else {
    dockPromptEl.textContent = `Nearest planet: ${closest.planet.name} · ${Math.round(
      closest.distance
    )} u`;
  }
};

const renderFlight = (now) => {
  const ctx = flightCanvas.getContext("2d");
  resizeFlightCanvas();
  const deltaSeconds = Math.min((now - flightState.lastFrame) / 1000, 0.05);
  flightState.lastFrame = now;
  updateFlight(deltaSeconds);

  const { width, height } = flightCanvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#05070f";
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

  if (player && world) {
    const planets = getPlanetsInSystem(player.systemId);
    planets.forEach((planet) => {
      const position = planetPositions.get(planet.id);
      if (!position) {
        return;
      }
      const x = centerX + (position.x - flightState.x);
      const y = centerY + (position.y - flightState.y);
      const distance = Math.hypot(flightState.x - position.x, flightState.y - position.y);
      const highlight = !player.planetId && distance <= dockingRange;

      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = highlight ? "#ffd37a" : "#5fb3ff";
      ctx.beginPath();
      ctx.arc(0, 0, position.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, position.radius + position.glow, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "rgba(230, 236, 255, 0.8)";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText(planet.name, x + position.radius + 10, y + 4);
    });
  }

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
    systemNameEl.textContent = "Awaiting login…";
  } else if (player.planetId) {
    const planetName = getCurrentPlanet()?.name || "Unknown";
    const systemName = world?.systems.find((system) => system.id === player.systemId)?.name;
    systemNameEl.textContent = systemName ? `System: ${systemName}` : "";
    flightStatusEl.textContent = `Docked at ${planetName}. Engines offline.`;
    dockPromptEl.textContent = "";
  } else {
    const speed = Math.hypot(flightState.vx, flightState.vy).toFixed(1);
    const systemName = world?.systems.find((system) => system.id === player.systemId)?.name;
    systemNameEl.textContent = systemName ? `System: ${systemName}` : "";
    flightStatusEl.textContent = `Cruising · Velocity ${speed} u/s`;
    updateDockingTarget();
  }

  requestAnimationFrame(renderFlight);
};

const renderShip = () => {
  if (!player) {
    return;
  }
  const { ship } = player;
  shipInfoEl.innerHTML = `
    <span><strong>${ship.name}</strong></span>
    <span>Hull: ${ship.hull} · Shield: ${ship.shield}</span>
    <span>Cargo: ${ship.cargo} · Fuel: ${ship.fuel}</span>
    <span>Hardpoints: ${player.weapons.length}/${ship.hardpoints}</span>
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

const renderDockedInfo = () => {
  if (!player || !world) {
    return;
  }
  const planet = getCurrentPlanet();
  if (!planet) {
    dockedInfoEl.innerHTML = "";
    return;
  }
  const services = ["Recharge", "Trade"];
  if (planet.missionBoard) {
    services.push("Mission BBS");
  }
  if (planet.outfitter) {
    services.push("Outfitter");
  }
  if (planet.shipyard) {
    services.push("Shipyard");
  }
  dockedInfoEl.innerHTML = `
    <span><strong>${planet.name}</strong></span>
    <span>Services: ${services.join(" · ")}</span>
  `;
};

const refreshUi = () => {
  if (!player) {
    return;
  }
  pilotNameDisplayEl.textContent = player.name ? `Pilot: ${player.name}` : "";
  creditsEl.textContent = formatCredits(player.credits);
  renderShip();
  renderDockedInfo();
  renderLog();

  const docked = Boolean(player.planetId);
  dockedPanelEl.classList.toggle("hidden", !docked);

  if (docked) {
    const planet = getCurrentPlanet();
    if (planet?.missionBoard) {
      sendAction({ type: "requestMissions" });
    } else {
      missionBoardEl.innerHTML = "<p>No mission board at this planet.</p>";
    }

    if (planet?.outfitter) {
      renderOutfits();
    } else {
      outfitListEl.innerHTML = "<p>Outfitter unavailable here.</p>";
    }

    if (planet?.shipyard) {
      renderWeapons();
    } else {
      weaponListEl.innerHTML = "<p>Shipyard access unavailable here.</p>";
    }
  } else {
    missionBoardEl.innerHTML = "<p>Dock to access the mission board.</p>";
    outfitListEl.innerHTML = "<p>Dock to access the outfitter.</p>";
    weaponListEl.innerHTML = "<p>Dock to access the shipyard.</p>";
  }
};

const setWeaponStatus = (message) => {
  weaponStatusEl.textContent = message;
  if (weaponStatusTimeout) {
    clearTimeout(weaponStatusTimeout);
  }
  weaponStatusTimeout = setTimeout(() => {
    weaponStatusEl.textContent = "";
  }, 800);
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
      isLoggedIn = true;
      saveStoredPilot(player.name);
      hideLoginOverlay();
      buildPlanetPositions();
      refreshUi();
      return;
    }
    if (payload.type === "state") {
      player = payload.player;
      refreshUi();
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
  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat) {
      setWeaponStatus("Primary weapons fired.");
    }
    return;
  }
  if (event.key === "Shift") {
    event.preventDefault();
    if (!event.repeat) {
      setWeaponStatus("Secondary weapons fired.");
    }
    return;
  }
  if (event.key === "l" || event.key === "L") {
    if (!event.repeat && currentDockingTarget && currentDockingTarget.distance <= dockingRange) {
      sendAction({ type: "dock", planetId: currentDockingTarget.planet.id });
    }
    return;
  }
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) {
    keysPressed.add(event.key);
    event.preventDefault();
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
