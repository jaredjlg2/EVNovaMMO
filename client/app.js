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
const mapOverlayEl = document.getElementById("mapOverlay");
const mapCanvas = document.getElementById("mapCanvas");
const mapRouteEl = document.getElementById("mapRoute");
const mapHintEl = document.getElementById("mapHint");
const closeMapBtn = document.getElementById("closeMapBtn");
const clearRouteBtn = document.getElementById("clearRouteBtn");

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
let mapOpen = false;
let routePlan = [];
let presencePlayers = [];
let positionInterval = null;

const storedPilotKey = "evnova_pilots";
const maxStoredPilots = 5;
const dockingRange = 70;
const jumpMinimumDistance = 240;
const jumpDurations = {
  spool: 0.6,
  flash: 0.25,
  cooldown: 0.35
};

const flightState = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  angle: -Math.PI / 2,
  lastFrame: performance.now()
};

const keysPressed = new Set();
const projectiles = [];
const explosions = [];
const jumpState = {
  active: false,
  phase: "idle",
  startedAt: 0,
  targetSystemId: null
};

const weaponStyles = {
  pulse_laser: { color: "#ff7ad8", glow: "rgba(255, 170, 230, 0.9)", width: 2, length: 18 },
  ion_blaster: { color: "#7ad8ff", glow: "rgba(180, 240, 255, 0.9)", width: 2, length: 16 },
  rail_cannon: { color: "#ffd37a", glow: "rgba(255, 231, 176, 0.95)", width: 3, length: 22 }
};

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

const shipHitRadius = 16;

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

const getSystemById = (systemId) => world?.systems.find((system) => system.id === systemId) ?? null;

const getCurrentSystem = () => (player ? getSystemById(player.systemId) : null);

const getDistanceFromCenter = () => Math.hypot(flightState.x, flightState.y);

const setMapOpen = (nextState) => {
  if (!world) {
    return;
  }
  mapOpen = typeof nextState === "boolean" ? nextState : !mapOpen;
  mapOverlayEl.classList.toggle("hidden", !mapOpen);
  if (mapOpen) {
    renderMap();
  }
};

const updateRoutePlan = (systemId) => {
  if (!systemId) {
    return;
  }
  const existingIndex = routePlan.indexOf(systemId);
  if (existingIndex >= 0) {
    routePlan = routePlan.slice(0, existingIndex + 1);
  } else {
    routePlan = [...routePlan, systemId];
  }
  updateMapRoute();
  renderMap();
};

const updateMapRoute = () => {
  mapRouteEl.innerHTML = "";
  if (!world || routePlan.length === 0) {
    mapRouteEl.innerHTML = "<li>No route plotted.</li>";
    mapHintEl.textContent = "Click systems to add waypoints.";
    return;
  }
  routePlan.forEach((systemId, index) => {
    const system = getSystemById(systemId);
    const item = document.createElement("li");
    item.textContent = system ? system.name : systemId;
    if (index === 0) {
      item.textContent = `${item.textContent} (next)`;
    }
    mapRouteEl.appendChild(item);
  });
  mapHintEl.textContent = "Press J when you're far enough from the core to jump.";
};

const computeMapLayout = () => {
  if (!world) {
    return null;
  }
  const padding = 60;
  const xs = world.systems.map((system) => system.x);
  const ys = world.systems.map((system) => system.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = mapCanvas.width - padding * 2;
  const height = mapCanvas.height - padding * 2;
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const scale = Math.min(width / spanX, height / spanY);
  return {
    padding,
    scale,
    offsetX: padding - minX * scale,
    offsetY: padding - minY * scale
  };
};

const systemToMap = (system, layout) => ({
  x: system.x * layout.scale + layout.offsetX,
  y: system.y * layout.scale + layout.offsetY
});

const renderMap = () => {
  if (!mapOpen || !world) {
    return;
  }
  const ctx = mapCanvas.getContext("2d");
  const { clientWidth, clientHeight } = mapCanvas;
  if (mapCanvas.width !== clientWidth || mapCanvas.height !== clientHeight) {
    mapCanvas.width = clientWidth;
    mapCanvas.height = clientHeight;
  }
  ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
  ctx.fillStyle = "#05070f";
  ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

  const layout = computeMapLayout();
  if (!layout) {
    return;
  }
  const linkSet = new Set();
  world.systems.forEach((system) => {
    system.links.forEach((linkedId) => {
      const key = [system.id, linkedId].sort().join("-");
      if (linkSet.has(key)) {
        return;
      }
      linkSet.add(key);
      const linkedSystem = getSystemById(linkedId);
      if (!linkedSystem) {
        return;
      }
      const start = systemToMap(system, layout);
      const end = systemToMap(linkedSystem, layout);
      ctx.strokeStyle = "rgba(120, 160, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });
  });

  const currentSystem = getCurrentSystem();
  if (currentSystem) {
    const routePoints = [currentSystem.id, ...routePlan].filter((id, index, arr) => {
      if (index === 0) {
        return true;
      }
      return id !== arr[index - 1];
    });
    ctx.strokeStyle = "rgba(255, 211, 122, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    routePoints.forEach((systemId, index) => {
      const system = getSystemById(systemId);
      if (!system) {
        return;
      }
      const point = systemToMap(system, layout);
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  }

  world.systems.forEach((system) => {
    const point = systemToMap(system, layout);
    const isCurrent = currentSystem && system.id === currentSystem.id;
    const isInRoute = routePlan.includes(system.id);
    ctx.fillStyle = isCurrent ? "#ffd37a" : isInRoute ? "#8bd4ff" : "#5a7ad8";
    ctx.beginPath();
    ctx.arc(point.x, point.y, isCurrent ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(230, 236, 255, 0.85)";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(system.name, point.x + 10, point.y - 8);
  });
};

const handleMapClick = (event) => {
  if (!mapOpen || !world) {
    return;
  }
  const rect = mapCanvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  const layout = computeMapLayout();
  if (!layout) {
    return;
  }
  const hitRadius = 12;
  const hitSystem = world.systems.find((system) => {
    const point = systemToMap(system, layout);
    return Math.hypot(point.x - clickX, point.y - clickY) <= hitRadius;
  });
  if (hitSystem) {
    updateRoutePlan(hitSystem.id);
  }
};

const spawnProjectiles = (originX, originY, angle, weaponIds, ownerId = null) => {
  const resolvedWeapons = weaponIds.length > 0 ? weaponIds : ["pulse_laser"];
  const spacing = 8;
  const forwardOffset = 18;
  const lateralOffsets = resolvedWeapons.map(
    (_, index) => (index - (resolvedWeapons.length - 1) / 2) * spacing
  );
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  resolvedWeapons.forEach((weaponId, index) => {
    const style = weaponStyles[weaponId] || weaponStyles.pulse_laser;
    const lateral = lateralOffsets[index];
    const spawnX = originX + cos * forwardOffset - sin * lateral;
    const spawnY = originY + sin * forwardOffset + cos * lateral;
    projectiles.push({
      x: spawnX,
      y: spawnY,
      vx: cos * 520,
      vy: sin * 520,
      life: 0.8,
      angle,
      style,
      ownerId
    });
  });
};

const spawnExplosion = (x, y, options = {}) => {
  const { maxLife = 0.6, maxRadius = 32, color = "#ffb772", glow = "#ff6f4a" } = options;
  explosions.push({
    x,
    y,
    life: maxLife,
    maxLife,
    maxRadius,
    color,
    glow
  });
};

const firePrimaryWeapons = () => {
  if (!player || !isLoggedIn || player.planetId) {
    return;
  }
  const weaponIds = player.weapons.length > 0 ? player.weapons : ["pulse_laser"];
  spawnProjectiles(flightState.x, flightState.y, flightState.angle, weaponIds, player.id);
  sendAction({
    type: "fire",
    x: flightState.x,
    y: flightState.y,
    angle: flightState.angle,
    systemId: player.systemId
  });
};

const getVisiblePlayers = () => {
  if (!player) {
    return [];
  }
  return presencePlayers.filter(
    (other) =>
      other.id !== player.id &&
      other.systemId === player.systemId &&
      !other.planetId &&
      typeof other.x === "number" &&
      typeof other.y === "number"
  );
};

const getProjectileTargets = () => {
  const targets = getVisiblePlayers().map((other) => ({
    id: other.id,
    x: other.x,
    y: other.y
  }));
  if (player && isLoggedIn && !player.planetId) {
    targets.push({ id: player.id, x: flightState.x, y: flightState.y });
  }
  return targets;
};

const updateProjectiles = (deltaSeconds) => {
  const targets = getProjectileTargets();
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = projectiles[i];
    projectile.x += projectile.vx * deltaSeconds;
    projectile.y += projectile.vy * deltaSeconds;
    projectile.life -= deltaSeconds;
    let hitTarget = false;
    for (let t = 0; t < targets.length; t += 1) {
      const target = targets[t];
      if (projectile.ownerId && projectile.ownerId === target.id) {
        continue;
      }
      const distance = Math.hypot(projectile.x - target.x, projectile.y - target.y);
      if (distance <= shipHitRadius) {
        hitTarget = true;
        spawnExplosion(projectile.x, projectile.y, {
          maxLife: 0.25,
          maxRadius: 16,
          color: "#ffd27a",
          glow: "#ff7f62"
        });
        break;
      }
    }
    if (projectile.life <= 0 || hitTarget) {
      projectiles.splice(i, 1);
    }
  }
};

const renderProjectiles = (ctx, centerX, centerY) => {
  projectiles.forEach((projectile) => {
    const screenX = centerX + (projectile.x - flightState.x);
    const screenY = centerY + (projectile.y - flightState.y);
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(projectile.angle);
    ctx.strokeStyle = projectile.style.color;
    ctx.shadowColor = projectile.style.glow;
    ctx.shadowBlur = 8;
    ctx.lineWidth = projectile.style.width;
    ctx.beginPath();
    ctx.moveTo(-projectile.style.length, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.restore();
  });
};

const updateExplosions = (deltaSeconds) => {
  for (let i = explosions.length - 1; i >= 0; i -= 1) {
    const explosion = explosions[i];
    explosion.life -= deltaSeconds;
    if (explosion.life <= 0) {
      explosions.splice(i, 1);
    }
  }
};

const renderExplosions = (ctx, centerX, centerY) => {
  explosions.forEach((explosion) => {
    const screenX = centerX + (explosion.x - flightState.x);
    const screenY = centerY + (explosion.y - flightState.y);
    const progress = 1 - explosion.life / explosion.maxLife;
    const radius = explosion.maxRadius * (0.4 + progress * 0.6);
    const alpha = explosion.life / explosion.maxLife;
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.globalAlpha = alpha;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, explosion.color);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = explosion.glow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
};

const startJumpSequence = (targetSystemId) => {
  jumpState.active = true;
  jumpState.phase = "spool";
  jumpState.startedAt = performance.now();
  jumpState.targetSystemId = targetSystemId;
  setWeaponStatus("Hyperjump charging...");
};

const updateJumpSequence = (now) => {
  if (!jumpState.active) {
    return;
  }
  const elapsed = (now - jumpState.startedAt) / 1000;
  if (jumpState.phase === "spool" && elapsed >= jumpDurations.spool) {
    jumpState.phase = "flash";
    jumpState.startedAt = now;
    if (jumpState.targetSystemId) {
      sendAction({ type: "jump", systemId: jumpState.targetSystemId });
    }
    if (routePlan[0] === jumpState.targetSystemId) {
      routePlan = routePlan.slice(1);
    }
    updateMapRoute();
    flightState.x = 0;
    flightState.y = 0;
    flightState.vx = 0;
    flightState.vy = 0;
  } else if (jumpState.phase === "flash" && elapsed >= jumpDurations.flash) {
    jumpState.phase = "cooldown";
    jumpState.startedAt = now;
  } else if (jumpState.phase === "cooldown" && elapsed >= jumpDurations.cooldown) {
    jumpState.active = false;
    jumpState.phase = "idle";
    jumpState.targetSystemId = null;
  }
};

const attemptJump = () => {
  if (!player || !isLoggedIn) {
    return;
  }
  if (player.planetId) {
    setWeaponStatus("Undock before attempting a jump.");
    return;
  }
  if (jumpState.active) {
    return;
  }
  if (routePlan.length === 0) {
    setWeaponStatus("No route plotted. Open the starmap (M).");
    return;
  }
  if (routePlan[0] === player.systemId) {
    routePlan = routePlan.slice(1);
  }
  const nextSystemId = routePlan[0];
  if (!nextSystemId) {
    updateMapRoute();
    setWeaponStatus("Route complete. Plot a new jump.");
    return;
  }
  const currentSystem = getCurrentSystem();
  if (!currentSystem?.links.includes(nextSystemId)) {
    setWeaponStatus("Jump target not in range. Adjust your route.");
    return;
  }
  if (getDistanceFromCenter() < jumpMinimumDistance) {
    setWeaponStatus("Move farther from the system center to jump.");
    return;
  }
  startJumpSequence(nextSystemId);
};

const updateFlight = (deltaSeconds) => {
  if (!player || !isLoggedIn) {
    return;
  }
  const docked = Boolean(player.planetId);
  const isJumping = jumpState.active && jumpState.phase !== "cooldown";
  const acceleration = docked || isJumping ? 0 : 220;
  const maxSpeed = docked ? 0 : 280;
  const turnRate = docked || isJumping ? 0 : 2.6;

  if (!docked && !isJumping) {
    const turningLeft = keysPressed.has("ArrowLeft") || keysPressed.has("a");
    const turningRight = keysPressed.has("ArrowRight") || keysPressed.has("d");
    const turnDirection = Number(turningRight) - Number(turningLeft);
    if (turnDirection !== 0) {
      flightState.angle += turnDirection * turnRate * deltaSeconds;
    }

    const boosting = keysPressed.has("ArrowUp") || keysPressed.has("w");
    if (boosting) {
      flightState.vx += Math.cos(flightState.angle) * acceleration * deltaSeconds;
      flightState.vy += Math.sin(flightState.angle) * acceleration * deltaSeconds;
    }
  }

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
  updateProjectiles(deltaSeconds);
  updateExplosions(deltaSeconds);
  updateJumpSequence(now);

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

  if (jumpState.active) {
    const elapsed = (now - jumpState.startedAt) / 1000;
    const spoolIntensity =
      jumpState.phase === "spool" ? Math.min(elapsed / jumpDurations.spool, 1) : 1;
    ctx.strokeStyle = `rgba(210, 230, 255, ${0.5 * spoolIntensity})`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 40; i += 1) {
      const angle = (Math.PI * 2 * i) / 40;
      const length = 40 + 120 * spoolIntensity;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * 10, centerY + Math.sin(angle) * 10);
      ctx.lineTo(centerX + Math.cos(angle) * length, centerY + Math.sin(angle) * length);
      ctx.stroke();
    }
    if (jumpState.phase === "flash") {
      const flashAlpha = 1 - Math.min(elapsed / jumpDurations.flash, 1);
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

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
    getVisiblePlayers().forEach((other) => {
      const screenX = centerX + (other.x - flightState.x);
      const screenY = centerY + (other.y - flightState.y);
      if (screenX < -40 || screenX > width + 40 || screenY < -40 || screenY > height + 40) {
        return;
      }
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate((other.angle ?? 0) + Math.PI / 2);
      ctx.fillStyle = "#ff7a7a";
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(9, 9);
      ctx.lineTo(0, 5);
      ctx.lineTo(-9, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "rgba(255, 210, 210, 0.9)";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText(other.name, screenX + 12, screenY - 10);
    });

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(flightState.angle + Math.PI / 2);
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

  if (player && isLoggedIn) {
    renderProjectiles(ctx, centerX, centerY);
    renderExplosions(ctx, centerX, centerY);
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
    if (jumpState.active) {
      flightStatusEl.textContent = "Hyperjump sequence active…";
    } else {
      flightStatusEl.textContent = `Cruising · Velocity ${speed} u/s`;
    }
    updateDockingTarget();
  }

  if (mapOpen) {
    renderMap();
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
    <span>Hull: ${player.hull}/${ship.hull} · Shield: ${player.shield}/${ship.shield}</span>
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
  updateMapRoute();

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
    presencePlayers = [];
    pilotNameDisplayEl.textContent = "";
    showLoginOverlay("Connection lost. Please reconnect.");
  });

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === "loginRequired") {
      isLoggedIn = false;
      player = null;
      presencePlayers = [];
      projectiles.length = 0;
      explosions.length = 0;
      showLoginOverlay(payload.message || "");
      return;
    }
    if (payload.type === "loginError") {
      showLoginOverlay(payload.message);
      return;
    }
    if (payload.type === "init") {
      world = payload.world;
      player = payload.player;
      presencePlayers = payload.players || [];
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
    if (payload.type === "presence") {
      presencePlayers = payload.players || [];
      return;
    }
    if (payload.type === "fire") {
      if (!player || !isLoggedIn) {
        return;
      }
      if (payload.shooterId === player.id) {
        return;
      }
      if (payload.systemId !== player.systemId || player.planetId) {
        return;
      }
      const originX = Number(payload.x);
      const originY = Number(payload.y);
      const angle = Number(payload.angle);
      if (Number.isNaN(originX) || Number.isNaN(originY) || Number.isNaN(angle)) {
        return;
      }
      const weaponIds = Array.isArray(payload.weapons) ? payload.weapons : ["pulse_laser"];
      const ownerId = payload.shooterId || null;
      spawnProjectiles(originX, originY, angle, weaponIds, ownerId);
    }
    if (payload.type === "destroyed") {
      if (payload.systemId && player?.systemId !== payload.systemId) {
        return;
      }
      if (typeof payload.x === "number" && typeof payload.y === "number") {
        spawnExplosion(payload.x, payload.y, { maxLife: 0.8, maxRadius: 48 });
      }
      if (payload.playerId === player?.id) {
        isLoggedIn = false;
        player = null;
        presencePlayers = [];
        projectiles.length = 0;
        explosions.length = 0;
        showLoginOverlay("Ship destroyed. Re-login to respawn.");
      }
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
  if (event.key === "m" || event.key === "M") {
    event.preventDefault();
    setMapOpen();
    return;
  }
  if (mapOpen) {
    return;
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat) {
      firePrimaryWeapons();
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
  if (event.key === "j" || event.key === "J") {
    event.preventDefault();
    if (!event.repeat) {
      attemptJump();
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
  if (mapOpen) {
    renderMap();
  }
});

mapCanvas.addEventListener("click", handleMapClick);
closeMapBtn.addEventListener("click", () => setMapOpen(false));
clearRouteBtn.addEventListener("click", () => {
  routePlan = [];
  updateMapRoute();
  renderMap();
});

connect();
renderPilotHints();
requestAnimationFrame(renderFlight);

positionInterval = setInterval(() => {
  if (!player || !isLoggedIn || player.planetId) {
    return;
  }
  sendAction({
    type: "position",
    x: flightState.x,
    y: flightState.y,
    angle: flightState.angle
  });
}, 120);
