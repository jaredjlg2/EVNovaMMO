const connectionEl = document.getElementById("connection");
const creditsEl = document.getElementById("credits");
const pilotNameDisplayEl = document.getElementById("pilotNameDisplay");
const systemNameEl = document.getElementById("systemName");
const shipInfoEl = document.getElementById("shipInfo");
const targetInfoEl = document.getElementById("targetInfo");
const miniMapCanvas = document.getElementById("miniMapCanvas");
const weaponListEl = document.getElementById("weaponList");
const secondaryWeaponListEl = document.getElementById("secondaryWeaponList");
const outfitListEl = document.getElementById("outfitList");
const shipListEl = document.getElementById("shipList");
const missionBoardEl = document.getElementById("missionBoard");
const missionDetailEl = document.getElementById("missionDetail");
const dockedPanelEl = document.getElementById("dockedPanel");
const dockedInfoEl = document.getElementById("dockedInfo");
const dockedMenuEl = document.getElementById("dockedMenu");
const dockedBackBtn = document.getElementById("dockedBackBtn");
const dockedMenuMissionBtn = document.getElementById("dockedMenuMissions");
const dockedMenuTradingBtn = document.getElementById("dockedMenuTrading");
const dockedMenuOutfitterBtn = document.getElementById("dockedMenuOutfitter");
const dockedMenuShipyardBtn = document.getElementById("dockedMenuShipyard");
const dockedMenuBarBtn = document.getElementById("dockedMenuBar");
const cargoSummaryEl = document.getElementById("cargoSummary");
const tradeListEl = document.getElementById("tradeList");
const logEl = document.getElementById("log");
const flightCanvas = document.getElementById("flightCanvas");
const flightStatusEl = document.getElementById("flightStatus");
const dockPromptEl = document.getElementById("dockPrompt");
const weaponStatusEl = document.getElementById("weaponStatus");
const secondaryStatusEl = document.getElementById("secondaryStatus");
const mapOverlayEl = document.getElementById("mapOverlay");
const mapCanvas = document.getElementById("mapCanvas");
const mapRouteEl = document.getElementById("mapRoute");
const mapHintEl = document.getElementById("mapHint");
const closeMapBtn = document.getElementById("closeMapBtn");
const clearRouteBtn = document.getElementById("clearRouteBtn");
const missionLogOverlayEl = document.getElementById("missionLogOverlay");
const missionLogListEl = document.getElementById("missionLogList");
const closeMissionLogBtn = document.getElementById("closeMissionLogBtn");

const loginOverlayEl = document.getElementById("loginOverlay");
const loginFormEl = document.getElementById("loginForm");
const pilotNameInputEl = document.getElementById("pilotName");
const loginErrorEl = document.getElementById("loginError");
const loginHintEl = document.getElementById("loginHint");

const undockBtn = document.getElementById("undockBtn");
const completeBtn = document.getElementById("completeBtn");
const dockedSectionEls = Array.from(document.querySelectorAll(".docked-section"));
const dockedMenuButtons = [
  dockedMenuMissionBtn,
  dockedMenuTradingBtn,
  dockedMenuOutfitterBtn,
  dockedMenuShipyardBtn,
  dockedMenuBarBtn
];

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
const presenceSnapshots = new Map();
let positionInterval = null;
let availableMissions = [];
let highlightedMissionId = null;
let marketGoods = [];
let activeDockedSection = null;
let lastDockedPlanetId = null;
let targetLockId = null;
let missionLogOpen = false;
let selectedSecondaryIndex = 0;
const mapView = {
  zoom: 1,
  panX: 0,
  panY: 0,
  isPanning: false,
  lastX: 0,
  lastY: 0,
  dragged: false
};

const storedPilotKey = "evnova_pilots";
const maxStoredPilots = 5;
const dockingRange = 70;
const jumpMinimumDistance = 240;
const jumpArrivalDistance = 360;
const jumpArrivalSpeed = 180;
const jumpAcceleration = 720;
const jumpTurnRate = 7.5;
const jumpMaxSpeed = 520;
const miniMapRange = 520;
const jumpDurations = {
  align: 0.3,
  burn: 0.35,
  flash: 0.25,
  cooldown: 0.35
};
const mapZoom = {
  min: 0.6,
  max: 2.6
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
  targetSystemId: null,
  headingX: 0,
  headingY: 0,
  targetAngle: 0
};

const weaponStyles = {
  pulse_laser: { color: "#ff7ad8", glow: "rgba(255, 170, 230, 0.9)", width: 2, length: 18 },
  ion_blaster: { color: "#7ad8ff", glow: "rgba(180, 240, 255, 0.9)", width: 2, length: 16 },
  rail_cannon: { color: "#ffd37a", glow: "rgba(255, 231, 176, 0.95)", width: 3, length: 22 },
  sting_missile: { color: "#ff8b5c", glow: "rgba(255, 160, 120, 0.95)", width: 3, length: 26 },
  radar_missile: { color: "#f4ff7a", glow: "rgba(240, 255, 170, 0.95)", width: 3, length: 24 },
  viper_rockets: { color: "#9cff8f", glow: "rgba(170, 255, 190, 0.9)", width: 3, length: 24 },
  thunder_torpedo: { color: "#b39cff", glow: "rgba(190, 170, 255, 0.9)", width: 4, length: 28 }
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
const shipSprites = new Map();
const shipSpriteBasePath = "images/ships";

const loadShipSprites = (ships = []) => {
  ships.forEach((ship) => {
    if (!ship?.id || shipSprites.has(ship.id)) {
      return;
    }
    const sprite = { image: new Image(), loaded: false, failed: false };
    sprite.image.onload = () => {
      sprite.loaded = true;
    };
    sprite.image.onerror = () => {
      sprite.failed = true;
    };
    sprite.image.src = `${shipSpriteBasePath}/${ship.id}.png`;
    shipSprites.set(ship.id, sprite);
  });
};

const getShipSprite = (shipId) => (shipId ? shipSprites.get(shipId) : null);

const sendAction = (payload) => {
  if (!socket || socket.readyState !== 1) {
    return;
  }
  socket.send(JSON.stringify(payload));
};

const formatCredits = (value) => `${value.toLocaleString()} cr`;

const parseShipClassification = (shipName = "") => {
  const match = shipName.match(/^(.*)\((.*)\)\s*$/);
  if (match) {
    return {
      className: match[1].trim(),
      typeName: match[2].trim()
    };
  }
  const trimmed = shipName.trim();
  if (!trimmed) {
    return { className: "Unknown", typeName: "Unknown" };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { className: trimmed, typeName: "Unknown" };
  }
  return {
    className: parts.slice(0, -1).join(" "),
    typeName: parts.slice(-1).join(" ")
  };
};

const getShipTradeInValue = () => {
  if (!player || !world) {
    return 0;
  }
  const currentShip = world.ships.find((ship) => ship.id === player.ship.id);
  if (!currentShip) {
    return 0;
  }
  return Math.round(currentShip.price * 0.6);
};

const getWeaponById = (weaponId) => {
  if (!world || !weaponId) {
    return null;
  }
  return world.weapons.find((weapon) => weapon.id === weaponId) || null;
};

const getSecondaryWeaponOptions = () => {
  if (!player) {
    return [];
  }
  const seen = new Set();
  return player.secondaryWeapons.filter((weaponId) => {
    if (seen.has(weaponId)) {
      return false;
    }
    seen.add(weaponId);
    return true;
  });
};

const getSelectedSecondaryWeaponId = () => {
  const options = getSecondaryWeaponOptions();
  if (options.length === 0) {
    return null;
  }
  if (selectedSecondaryIndex >= options.length) {
    selectedSecondaryIndex = 0;
  }
  return options[selectedSecondaryIndex];
};

const getSecondaryAmmoCount = (ammoId) =>
  Math.max(0, player?.secondaryAmmo?.[ammoId] ?? 0);

const updateSecondaryStatus = () => {
  if (!secondaryStatusEl) {
    return;
  }
  if (!player || !world || !isLoggedIn) {
    secondaryStatusEl.textContent = "";
    return;
  }
  const selectedId = getSelectedSecondaryWeaponId();
  if (!selectedId) {
    secondaryStatusEl.textContent = "Secondary: None";
    return;
  }
  const weapon = getWeaponById(selectedId);
  if (!weapon) {
    secondaryStatusEl.textContent = "Secondary: Offline";
    return;
  }
  let status = `Secondary: ${weapon.name}`;
  if (weapon.ammoType) {
    const ammoWeapon = getWeaponById(weapon.ammoType);
    const ammoName = ammoWeapon?.name || "Ammo";
    const ammoCount = getSecondaryAmmoCount(weapon.ammoType);
    status += ` · ${ammoName}: ${ammoCount}`;
  }
  secondaryStatusEl.textContent = status;
};

const cycleSecondaryWeapon = () => {
  if (!player || !isLoggedIn) {
    return;
  }
  const options = getSecondaryWeaponOptions();
  if (options.length === 0) {
    setWeaponStatus("No secondary weapons installed.");
    updateSecondaryStatus();
    return;
  }
  selectedSecondaryIndex = (selectedSecondaryIndex + 1) % options.length;
  updateSecondaryStatus();
};

const getCargoUsed = () => {
  if (!player) {
    return 0;
  }
  const cargoTotal = (player.cargo || []).reduce((sum, entry) => sum + entry.quantity, 0);
  const missionCargo = (player.missions || [])
    .filter((mission) => mission.status === "active")
    .reduce((sum, mission) => sum + (mission.cargoSpace || 0), 0);
  return cargoTotal + missionCargo;
};

const getCargoCapacity = () => player?.ship?.cargo ?? 0;

const getCargoManifest = () => {
  if (!player || !world) {
    return [];
  }
  const goodsById = new Map(world.goods.map((good) => [good.id, good]));
  return (player.cargo || []).map((entry) => ({
    id: entry.goodId,
    name: goodsById.get(entry.goodId)?.name ?? entry.goodId,
    quantity: entry.quantity
  }));
};

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
  if (secondaryStatusEl) {
    secondaryStatusEl.textContent = "";
  }
  renderPilotHints();
};

const hideLoginOverlay = () => {
  loginOverlayEl.classList.add("hidden");
};

const wrapOffset = (value, size) => ((value % size) + size) % size;

const normalizeAngle = (angle) => {
  let normalized = angle;
  while (normalized > Math.PI) {
    normalized -= Math.PI * 2;
  }
  while (normalized < -Math.PI) {
    normalized += Math.PI * 2;
  }
  return normalized;
};

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

const getPlanetById = (planetId) => world?.planets.find((planet) => planet.id === planetId) ?? null;

const getMissionDestinationSystemId = (mission) => {
  if (!mission || !world) {
    return null;
  }
  const planet = getPlanetById(mission.toPlanetId);
  return planet?.systemId ?? null;
};

const getActiveMissionDestinationSystemId = () => {
  if (!player || !world) {
    return null;
  }
  const active = player.missions.find((mission) => mission.status === "active");
  return active ? getMissionDestinationSystemId(active) : null;
};

const getHighlightedMissionDestinationSystemId = () => {
  if (!highlightedMissionId) {
    return null;
  }
  const mission = availableMissions.find((item) => item.id === highlightedMissionId);
  return mission ? getMissionDestinationSystemId(mission) : null;
};

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

const setMissionLogOpen = (nextState) => {
  if (!missionLogOverlayEl) {
    return;
  }
  missionLogOpen = typeof nextState === "boolean" ? nextState : !missionLogOpen;
  missionLogOverlayEl.classList.toggle("hidden", !missionLogOpen);
  if (missionLogOpen) {
    renderMissionLog();
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
    mapHintEl.textContent = "Click systems to add waypoints. Drag to pan, scroll to zoom.";
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
  mapHintEl.textContent = "Press J when you're far enough from the core to jump. Drag to pan, scroll to zoom.";
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
  const baseScale = Math.min(width / spanX, height / spanY);
  const scale = baseScale * mapView.zoom;
  return {
    padding,
    scale,
    baseScale,
    minX,
    minY,
    offsetX: padding - minX * scale + mapView.panX,
    offsetY: padding - minY * scale + mapView.panY
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

  const drawIndicator = (point, color, offset = -16) => {
    const size = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y + offset);
    ctx.lineTo(point.x - size / 2, point.y + offset - size);
    ctx.lineTo(point.x + size / 2, point.y + offset - size);
    ctx.closePath();
    ctx.fill();
  };

  const activeMissionSystemId = getActiveMissionDestinationSystemId();
  if (activeMissionSystemId) {
    const system = getSystemById(activeMissionSystemId);
    if (system) {
      const point = systemToMap(system, layout);
      drawIndicator(point, "#ff9a3d");
    }
  }

  const highlightedSystemId = getHighlightedMissionDestinationSystemId();
  if (highlightedSystemId) {
    const system = getSystemById(highlightedSystemId);
    if (system) {
      const point = systemToMap(system, layout);
      drawIndicator(point, "#6be36b", -28);
    }
  }
};

const handleMapClick = (event) => {
  if (!mapOpen || !world) {
    return;
  }
  if (mapView.dragged) {
    mapView.dragged = false;
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

const handleMapPanStart = (event) => {
  if (!mapOpen || !world || event.button !== 0) {
    return;
  }
  mapView.isPanning = true;
  mapView.dragged = false;
  mapView.lastX = event.clientX;
  mapView.lastY = event.clientY;
  mapCanvas.classList.add("is-panning");
};

const handleMapPanMove = (event) => {
  if (!mapView.isPanning || !mapOpen || !world) {
    return;
  }
  const deltaX = event.clientX - mapView.lastX;
  const deltaY = event.clientY - mapView.lastY;
  if (Math.hypot(deltaX, deltaY) > 2) {
    mapView.dragged = true;
  }
  mapView.panX += deltaX;
  mapView.panY += deltaY;
  mapView.lastX = event.clientX;
  mapView.lastY = event.clientY;
  renderMap();
};

const handleMapPanEnd = () => {
  if (!mapView.isPanning) {
    return;
  }
  mapView.isPanning = false;
  mapCanvas.classList.remove("is-panning");
};

const handleMapWheel = (event) => {
  if (!mapOpen || !world) {
    return;
  }
  event.preventDefault();
  const rect = mapCanvas.getBoundingClientRect();
  const cursorX = event.clientX - rect.left;
  const cursorY = event.clientY - rect.top;
  const layout = computeMapLayout();
  if (!layout) {
    return;
  }
  const worldX = (cursorX - layout.offsetX) / layout.scale;
  const worldY = (cursorY - layout.offsetY) / layout.scale;
  const zoomFactor = Math.exp(-event.deltaY * 0.001);
  const nextZoom = Math.min(mapZoom.max, Math.max(mapZoom.min, mapView.zoom * zoomFactor));
  if (nextZoom === mapView.zoom) {
    return;
  }
  const nextScale = layout.baseScale * nextZoom;
  const baseOffsetX = layout.padding - layout.minX * nextScale;
  const baseOffsetY = layout.padding - layout.minY * nextScale;
  mapView.panX = cursorX - (worldX * nextScale + baseOffsetX);
  mapView.panY = cursorY - (worldY * nextScale + baseOffsetY);
  mapView.zoom = nextZoom;
  renderMap();
};

const spawnProjectiles = (
  originX,
  originY,
  angle,
  weaponIds,
  ownerId = null,
  { allowFallback = true, targetId = null } = {}
) => {
  const resolvedWeapons = weaponIds.length > 0 ? weaponIds : allowFallback ? ["pulse_laser"] : [];
  if (resolvedWeapons.length === 0) {
    return;
  }
  const spacing = 8;
  const forwardOffset = 18;
  const lateralOffsets = resolvedWeapons.map(
    (_, index) => (index - (resolvedWeapons.length - 1) / 2) * spacing
  );
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  resolvedWeapons.forEach((weaponId, index) => {
    const weapon = getWeaponById(weaponId);
    const style = weaponStyles[weaponId] || weaponStyles.pulse_laser;
    const speed = weapon?.projectileSpeed ?? 520;
    const life = weapon?.projectileLife ?? 0.8;
    const turnRate = weapon?.turnRate ?? 0;
    const isHoming = Boolean(weapon?.homing && targetId);
    const lateral = lateralOffsets[index];
    const spawnX = originX + cos * forwardOffset - sin * lateral;
    const spawnY = originY + sin * forwardOffset + cos * lateral;
    projectiles.push({
      x: spawnX,
      y: spawnY,
      vx: cos * speed,
      vy: sin * speed,
      life,
      angle,
      style,
      ownerId,
      speed,
      turnRate,
      homing: isHoming,
      targetId: isHoming ? targetId : null
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
  spawnProjectiles(flightState.x, flightState.y, flightState.angle, weaponIds, player.id, {
    allowFallback: true
  });
  sendAction({
    type: "fire",
    x: flightState.x,
    y: flightState.y,
    angle: flightState.angle,
    systemId: player.systemId
  });
};

const fireSecondaryWeapons = () => {
  if (!player || !isLoggedIn || player.planetId) {
    return false;
  }
  const selectedWeaponId = getSelectedSecondaryWeaponId();
  if (!selectedWeaponId) {
    setWeaponStatus("No secondary weapons installed.");
    return false;
  }
  const weapon = getWeaponById(selectedWeaponId);
  if (!weapon) {
    setWeaponStatus("Secondary weapon offline.");
    return false;
  }
  if (weapon.requiresLock && !targetLockId) {
    setWeaponStatus("No target lock for radar missiles.");
    return false;
  }
  if (weapon.ammoType) {
    const ammoCount = getSecondaryAmmoCount(weapon.ammoType);
    if (ammoCount <= 0) {
      setWeaponStatus(`${weapon.name} out of ammo.`);
      return false;
    }
  }
  const projectileId = weapon.projectileId || weapon.ammoType || selectedWeaponId;
  spawnProjectiles(
    flightState.x,
    flightState.y,
    flightState.angle,
    [projectileId],
    player.id,
    {
      allowFallback: false,
      targetId: weapon.requiresLock ? targetLockId : null
    }
  );
  sendAction({
    type: "fireSecondary",
    x: flightState.x,
    y: flightState.y,
    angle: flightState.angle,
    systemId: player.systemId,
    secondaryWeaponId: selectedWeaponId,
    targetId: weapon.requiresLock ? targetLockId : null
  });
  return true;
};

const lerp = (start, end, t) => start + (end - start) * t;

const lerpAngle = (start, end, t) => {
  const delta = Math.atan2(Math.sin(end - start), Math.cos(end - start));
  return start + delta * t;
};

const updatePresencePlayers = (players) => {
  presencePlayers = players;
  const now = performance.now();
  const seen = new Set();
  players.forEach((entry) => {
    if (!entry?.id) {
      return;
    }
    if (player && entry.id === player.id) {
      if (typeof entry.hull === "number") {
        player.hull = entry.hull;
      }
      if (typeof entry.shield === "number") {
        player.shield = entry.shield;
      }
    }
    seen.add(entry.id);
    const previous = presenceSnapshots.get(entry.id);
    const prevX = previous ? previous.currX : entry.x ?? 0;
    const prevY = previous ? previous.currY : entry.y ?? 0;
    const prevAngle =
      previous?.currAngle ?? (typeof entry.angle === "number" ? entry.angle : 0);
    const interval = previous ? Math.min(Math.max(now - previous.updatedAt, 15), 60) : 30;
    presenceSnapshots.set(entry.id, {
      data: entry,
      prevX,
      prevY,
      currX: typeof entry.x === "number" ? entry.x : prevX,
      currY: typeof entry.y === "number" ? entry.y : prevY,
      prevAngle,
      currAngle: typeof entry.angle === "number" ? entry.angle : prevAngle,
      updatedAt: now,
      interval
    });
  });
  Array.from(presenceSnapshots.keys()).forEach((id) => {
    if (!seen.has(id)) {
      presenceSnapshots.delete(id);
    }
  });
};

const getVisiblePlayers = () => {
  if (!player) {
    return [];
  }
  const now = performance.now();
  const smoothed = Array.from(presenceSnapshots.values()).map((snapshot) => {
    const t =
      snapshot.interval > 0
        ? Math.min((now - snapshot.updatedAt) / snapshot.interval, 1)
        : 1;
    const x = lerp(snapshot.prevX, snapshot.currX, t);
    const y = lerp(snapshot.prevY, snapshot.currY, t);
    const angle = lerpAngle(snapshot.prevAngle, snapshot.currAngle, t);
    return { ...snapshot.data, x, y, angle };
  });
  return smoothed.filter(
    (other) =>
      other.id !== player.id &&
      other.systemId === player.systemId &&
      !other.planetId &&
      typeof other.x === "number" &&
      typeof other.y === "number"
  );
};

const getTargetCandidates = () => {
  if (!player || !isLoggedIn || player.planetId) {
    return [];
  }
  return getVisiblePlayers();
};

const isHostileTarget = (other) => {
  if (!player) {
    return false;
  }
  return other.isAi ? (other.hostileTo || []).includes(player.id) : true;
};

const getSortedTargetsByDistance = () =>
  getTargetCandidates()
    .map((other) => ({
      ...other,
      distance: Math.hypot(other.x - flightState.x, other.y - flightState.y)
    }))
    .sort((a, b) => a.distance - b.distance);

const updateTargetInfo = () => {
  if (!targetInfoEl) {
    return;
  }
  if (!player || !isLoggedIn || player.planetId) {
    targetInfoEl.innerHTML = "<span>Targeting offline.</span>";
    return;
  }
  const targets = getTargetCandidates();
  const target = targets.find((other) => other.id === targetLockId);
  if (!target) {
    targetInfoEl.innerHTML = `
      <span>No target locked.</span>
      <span class="hud-hint">Press Tab to cycle ships or R to lock the nearest hostile.</span>
    `;
    return;
  }
  const shipName = target.ship?.name ?? "Unknown Hull";
  const { className, typeName } = parseShipClassification(shipName);
  const shieldMax = target.ship?.shield ?? 0;
  const hullMax = target.ship?.hull ?? 0;
  const shieldValue = Math.max(0, target.shield ?? 0);
  const hullValue = Math.max(0, target.hull ?? 0);
  const distance = Math.round(Math.hypot(target.x - flightState.x, target.y - flightState.y));
  targetInfoEl.innerHTML = `
    <span><strong>${target.name ?? "Unknown Pilot"}</strong></span>
    <span>Ship class: ${className}</span>
    <span>Type: ${typeName}</span>
    <span>Shields: ${Math.round(shieldValue)} / ${shieldMax}</span>
    <span>Armor: ${Math.round(hullValue)} / ${hullMax}</span>
    <span>Range: ${distance} u</span>
  `;
};

const updateTargetLockStatus = () => {
  if (!targetLockId) {
    return;
  }
  const targets = getTargetCandidates();
  const stillVisible = targets.some((other) => other.id === targetLockId);
  if (!stillVisible) {
    targetLockId = null;
  }
};

const cycleTargetLock = () => {
  const targets = getSortedTargetsByDistance();
  if (targets.length === 0) {
    targetLockId = null;
    updateTargetInfo();
    return;
  }
  if (!targetLockId) {
    targetLockId = targets[0].id;
    updateTargetInfo();
    return;
  }
  const currentIndex = targets.findIndex((target) => target.id === targetLockId);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % targets.length;
  targetLockId = targets[nextIndex].id;
  updateTargetInfo();
};

const lockNearestHostileTarget = () => {
  const targets = getSortedTargetsByDistance().filter((target) => isHostileTarget(target));
  if (targets.length === 0) {
    targetLockId = null;
    updateTargetInfo();
    return;
  }
  targetLockId = targets[0].id;
  updateTargetInfo();
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
    if (projectile.homing && projectile.targetId) {
      const target = targets.find((entry) => entry.id === projectile.targetId);
      if (target) {
        const desiredAngle = Math.atan2(target.y - projectile.y, target.x - projectile.x);
        const turnSpeed = projectile.turnRate ?? 0;
        projectile.angle = turnSpeed
          ? lerpAngle(projectile.angle, desiredAngle, Math.min(1, turnSpeed * deltaSeconds))
          : desiredAngle;
        const speed = projectile.speed ?? Math.hypot(projectile.vx, projectile.vy);
        projectile.vx = Math.cos(projectile.angle) * speed;
        projectile.vy = Math.sin(projectile.angle) * speed;
      }
    }
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
      if (projectile.life <= 0 && projectile.homing) {
        spawnExplosion(projectile.x, projectile.y, {
          maxLife: 0.3,
          maxRadius: 20,
          color: "#ffe97a",
          glow: "#ffc65f"
        });
      }
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

const renderShipIcon = (ctx, shipId, angle, options = {}) => {
  const size = options.size ?? 30;
  const fallbackColor = options.fallbackColor ?? "#8bd4ff";
  const outlineColor = options.outlineColor ?? null;
  const sprite = getShipSprite(shipId);

  ctx.save();
  ctx.rotate(angle + Math.PI / 2);
  if (sprite?.loaded) {
    ctx.drawImage(sprite.image, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.beginPath();
    ctx.moveTo(0, -(size * 0.55));
    ctx.lineTo(size * 0.4, size * 0.4);
    ctx.lineTo(0, size * 0.2);
    ctx.lineTo(-size * 0.4, size * 0.4);
    ctx.closePath();
    ctx.fill();
  }
  if (outlineColor) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
};

const startJumpSequence = (targetSystemId) => {
  const currentSystem = getCurrentSystem();
  const targetSystem = getSystemById(targetSystemId);
  let headingX = Math.cos(flightState.angle);
  let headingY = Math.sin(flightState.angle);
  if (currentSystem && targetSystem) {
    const dx = targetSystem.x - currentSystem.x;
    const dy = targetSystem.y - currentSystem.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 0) {
      headingX = dx / distance;
      headingY = dy / distance;
    }
  }
  jumpState.active = true;
  jumpState.phase = "align";
  jumpState.startedAt = performance.now();
  jumpState.targetSystemId = targetSystemId;
  jumpState.headingX = headingX;
  jumpState.headingY = headingY;
  jumpState.targetAngle = Math.atan2(headingY, headingX);
  setWeaponStatus("Hyperjump charging...");
};

const updateJumpSequence = (now) => {
  if (!jumpState.active) {
    return;
  }
  const elapsed = (now - jumpState.startedAt) / 1000;
  if (jumpState.phase === "align" && elapsed >= jumpDurations.align) {
    jumpState.phase = "burn";
    jumpState.startedAt = now;
  } else if (jumpState.phase === "burn" && elapsed >= jumpDurations.burn) {
    jumpState.phase = "flash";
    jumpState.startedAt = now;
    if (jumpState.targetSystemId) {
      sendAction({ type: "jump", systemId: jumpState.targetSystemId });
    }
    if (routePlan[0] === jumpState.targetSystemId) {
      routePlan = routePlan.slice(1);
    }
    updateMapRoute();
    flightState.x = -jumpState.headingX * jumpArrivalDistance;
    flightState.y = -jumpState.headingY * jumpArrivalDistance;
    flightState.vx = jumpState.headingX * jumpArrivalSpeed;
    flightState.vy = jumpState.headingY * jumpArrivalSpeed;
    flightState.angle = jumpState.targetAngle;
  } else if (jumpState.phase === "flash" && elapsed >= jumpDurations.flash) {
    jumpState.phase = "cooldown";
    jumpState.startedAt = now;
  } else if (jumpState.phase === "cooldown" && elapsed >= jumpDurations.cooldown) {
    jumpState.active = false;
    jumpState.phase = "idle";
    jumpState.targetSystemId = null;
    jumpState.headingX = 0;
    jumpState.headingY = 0;
    jumpState.targetAngle = flightState.angle;
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
  const acceleration = docked ? 0 : 220;
  const maxSpeed = docked ? 0 : 280;
  const turnRate = docked ? 0 : 2.6;

  if (docked) {
    flightState.vx = 0;
    flightState.vy = 0;
  } else if (isJumping) {
    const angleDelta = normalizeAngle(jumpState.targetAngle - flightState.angle);
    const maxTurn = jumpTurnRate * deltaSeconds;
    if (Math.abs(angleDelta) <= maxTurn) {
      flightState.angle = jumpState.targetAngle;
    } else {
      flightState.angle += Math.sign(angleDelta) * maxTurn;
    }
    if (jumpState.phase === "burn") {
      flightState.vx += Math.cos(flightState.angle) * jumpAcceleration * deltaSeconds;
      flightState.vy += Math.sin(flightState.angle) * jumpAcceleration * deltaSeconds;
    }
    const jumpSpeed = Math.hypot(flightState.vx, flightState.vy);
    if (jumpSpeed > jumpMaxSpeed) {
      const scale = jumpMaxSpeed / jumpSpeed;
      flightState.vx *= scale;
      flightState.vy *= scale;
    }
  } else {
    const turningLeft = keysPressed.has("ArrowLeft") || keysPressed.has("a");
    const turningRight = keysPressed.has("ArrowRight") || keysPressed.has("d");
    const turnDirection = Number(turningRight) - Number(turningLeft);
    if (turnDirection !== 0) {
      flightState.angle += turnDirection * turnRate * deltaSeconds;
    }

    const boosting = keysPressed.has("ArrowUp");
    if (boosting) {
      flightState.vx += Math.cos(flightState.angle) * acceleration * deltaSeconds;
      flightState.vy += Math.sin(flightState.angle) * acceleration * deltaSeconds;
    }
  }

  if (!docked && !isJumping) {
    const speed = Math.hypot(flightState.vx, flightState.vy);
    if (speed > maxSpeed && maxSpeed > 0) {
      const scale = maxSpeed / speed;
      flightState.vx *= scale;
      flightState.vy *= scale;
    }
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

const renderMiniMap = () => {
  if (!miniMapCanvas) {
    return;
  }
  const ctx = miniMapCanvas.getContext("2d");
  const { clientWidth, clientHeight } = miniMapCanvas;
  if (miniMapCanvas.width !== clientWidth || miniMapCanvas.height !== clientHeight) {
    miniMapCanvas.width = clientWidth;
    miniMapCanvas.height = clientHeight;
  }

  const { width, height } = miniMapCanvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b1226";
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(Math.min(centerX, centerY) - 8, 0);

  ctx.strokeStyle = "rgba(120, 150, 210, 0.25)";
  ctx.lineWidth = 1;
  for (let ring = 1; ring <= 3; ring += 1) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, (radius * ring) / 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (!player || !isLoggedIn) {
    ctx.fillStyle = "rgba(160, 180, 230, 0.7)";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText("No telemetry", centerX - 36, centerY + 4);
    return;
  }

  const scale = radius / miniMapRange;

  const drawDot = (dx, dy, color, size = 3) => {
    const distance = Math.hypot(dx, dy);
    if (distance > miniMapRange) {
      return;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX + dx * scale, centerY + dy * scale, size, 0, Math.PI * 2);
    ctx.fill();
  };

  if (!player.planetId) {
    ctx.strokeStyle = "rgba(120, 160, 220, 0.2)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, dockingRange * scale, 0, Math.PI * 2);
    ctx.stroke();
  }

  const planets = getPlanetsInSystem(player.systemId);
  planets.forEach((planet) => {
    const position = planetPositions.get(planet.id);
    if (!position) {
      return;
    }
    const dx = position.x - flightState.x;
    const dy = position.y - flightState.y;
    drawDot(dx, dy, "rgba(130, 200, 255, 0.75)", 4);
  });

  const targets = getVisiblePlayers();
  targets.forEach((other) => {
    const dx = other.x - flightState.x;
    const dy = other.y - flightState.y;
    const isHostile = isHostileTarget(other);
    drawDot(dx, dy, isHostile ? "rgba(255, 130, 130, 0.9)" : "rgba(140, 200, 255, 0.9)", 3);
  });

  if (targetLockId) {
    const target = targets.find((other) => other.id === targetLockId);
    if (target) {
      const dx = target.x - flightState.x;
      const dy = target.y - flightState.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= miniMapRange) {
        ctx.strokeStyle = "rgba(255, 211, 122, 0.9)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX + dx * scale, centerY + dy * scale, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  ctx.fillStyle = "#ffd37a";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 211, 122, 0.8)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(
    centerX + Math.cos(flightState.angle) * 12,
    centerY + Math.sin(flightState.angle) * 12
  );
  ctx.stroke();
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
    const chargeProgress =
      jumpState.phase === "align" ? Math.min(elapsed / jumpDurations.align, 1) : 1;
    ctx.strokeStyle = `rgba(210, 230, 255, ${0.5 * chargeProgress})`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 40; i += 1) {
      const angle = (Math.PI * 2 * i) / 40;
      const length = 40 + 120 * chargeProgress;
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
      const isHostile = isHostileTarget(other);
      if (other.id === targetLockId) {
        ctx.strokeStyle = "rgba(255, 211, 122, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
      renderShipIcon(ctx, other.ship?.id, other.angle ?? 0, {
        size: 28,
        fallbackColor: isHostile ? "#ff7a7a" : "#7ad2ff",
        outlineColor: isHostile ? "rgba(255, 122, 122, 0.6)" : "rgba(122, 210, 255, 0.6)"
      });
      ctx.restore();

      ctx.fillStyle = isHostile ? "rgba(255, 210, 210, 0.9)" : "rgba(190, 230, 255, 0.9)";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText(other.name, screenX + 12, screenY - 10);
    });

    ctx.save();
    ctx.translate(centerX, centerY);
    renderShipIcon(ctx, player.ship?.id, flightState.angle, {
      size: 32,
      fallbackColor: "#8bd4ff"
    });
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

  updateTargetLockStatus();
  updateTargetInfo();
  renderMiniMap();

  requestAnimationFrame(renderFlight);
};

const renderShip = () => {
  if (!player) {
    return;
  }
  const { ship } = player;
  const cargoUsed = getCargoUsed();
  const cargoCapacity = getCargoCapacity();
  const shieldMax = ship.shield || 0;
  const hullMax = ship.hull || 0;
  const shieldValue = Math.max(0, player.shield || 0);
  const hullValue = Math.max(0, player.hull || 0);
  const shieldPercent = shieldMax > 0 ? Math.min(100, (shieldValue / shieldMax) * 100) : 0;
  const hullPercent = hullMax > 0 ? Math.min(100, (hullValue / hullMax) * 100) : 0;
  shipInfoEl.innerHTML = `
    <span><strong>${ship.name}</strong></span>
    <div class="ship-bars">
      <div class="ship-bar">
        <div class="ship-bar-header">
          <span>Shields</span>
          <span>${Math.round(shieldValue)}/${shieldMax}</span>
        </div>
        <div class="ship-bar-track">
          <div class="ship-bar-fill ship-bar-fill--shield" style="width: ${shieldPercent}%;"></div>
        </div>
      </div>
      <div class="ship-bar">
        <div class="ship-bar-header">
          <span>Armor</span>
          <span>${Math.round(hullValue)}/${hullMax}</span>
        </div>
        <div class="ship-bar-track">
          <div class="ship-bar-fill ship-bar-fill--armor" style="width: ${hullPercent}%;"></div>
        </div>
      </div>
    </div>
    <span>Cargo: ${cargoUsed}/${cargoCapacity} · Fuel: ${ship.fuel}</span>
    <span>Hardpoints: ${player.weapons.length}/${ship.hardpoints}</span>
    <span>Secondary Racks: ${player.secondaryWeapons.length}/${ship.secondaryHardpoints}</span>
  `;
};

const renderWeapons = () => {
  if (!player || !world) {
    return;
  }
  weaponListEl.innerHTML = "";
  secondaryWeaponListEl.innerHTML = "";
  world.weapons.forEach((weapon) => {
    const isSecondary = weapon.slotType === "secondary" || weapon.slotType === "secondaryAmmo";
    const isAmmo = weapon.slotType === "secondaryAmmo";
    const installed = isSecondary
      ? isAmmo
        ? getSecondaryAmmoCount(weapon.id)
        : player.secondaryWeapons.filter((id) => id === weapon.id).length
      : player.weapons.filter((id) => id === weapon.id).length;
    const installedLabel = isAmmo ? "Ammo" : "Installed";
    const ammoForLabel = weapon.ammoFor
      ? getWeaponById(weapon.ammoFor)?.name || "Launcher"
      : "";
    const card = document.createElement("div");
    card.className = "list-item";
    card.innerHTML = `
      <h4>${weapon.name}</h4>
      <p>Damage: ${weapon.damage} · Energy: ${weapon.energyCost}</p>
      <p>${formatCredits(weapon.price)}</p>
      ${weapon.ammoFor ? `<p>Ammo for: ${ammoForLabel}</p>` : ""}
      <p>${installedLabel}: ${installed}</p>
    `;
    const buyBtn = document.createElement("button");
    buyBtn.textContent = "Buy";
    buyBtn.addEventListener("click", () => {
      sendAction({ type: "buyWeapon", weaponId: weapon.id });
    });
    card.appendChild(buyBtn);
    if (isSecondary) {
      secondaryWeaponListEl.appendChild(card);
    } else {
      weaponListEl.appendChild(card);
    }
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

const renderShipyard = () => {
  if (!player || !world) {
    return;
  }
  shipListEl.innerHTML = "";
  const tradeInValue = getShipTradeInValue();
  world.ships.forEach((ship) => {
    const card = document.createElement("div");
    card.className = "list-item";
    const isCurrent = ship.id === player.ship.id;
    const netCost = Math.max(0, ship.price - tradeInValue);
    const statusLine = isCurrent ? "<p>Current ship.</p>" : "";
    card.innerHTML = `
      <h4>${ship.name}</h4>
      <p>Hull: ${ship.hull} · Shield: ${ship.shield} · Cargo: ${ship.cargo}</p>
      <p>Fuel: ${ship.fuel} · Hardpoints: ${ship.hardpoints} · Secondary: ${ship.secondaryHardpoints}</p>
      <p>Sticker: ${formatCredits(ship.price)} · Trade-in: ${formatCredits(tradeInValue)}</p>
      <p>Net cost: ${formatCredits(netCost)}</p>
      ${statusLine}
    `;
    const buyBtn = document.createElement("button");
    buyBtn.textContent = isCurrent ? "Current" : "Buy";
    buyBtn.disabled = isCurrent || player.credits < netCost;
    buyBtn.addEventListener("click", () => {
      sendAction({ type: "buyShip", shipId: ship.id });
    });
    card.appendChild(buyBtn);
    shipListEl.appendChild(card);
  });
};

const renderMarket = (market) => {
  if (!player || !world) {
    return;
  }
  marketGoods = market;
  const cargoUsed = getCargoUsed();
  const cargoCapacity = getCargoCapacity();
  const manifest = getCargoManifest();
  const manifestText =
    manifest.length > 0
      ? manifest.map((entry) => `${entry.name}: ${entry.quantity}`).join(" · ")
      : "No cargo loaded.";
  cargoSummaryEl.innerHTML = `
    <span><strong>Cargo Hold</strong></span>
    <span>Used: ${cargoUsed}/${cargoCapacity}</span>
    <span>${manifestText}</span>
  `;
  tradeListEl.innerHTML = "";
  market.forEach((good) => {
    const owned = player.cargo.find((entry) => entry.goodId === good.id)?.quantity ?? 0;
    const card = document.createElement("div");
    card.className = "list-item";
    card.innerHTML = `
      <h4>${good.name}</h4>
      <p>Market: ${good.level} · Price: ${formatCredits(good.price)}</p>
      <p>In hold: ${owned}</p>
    `;
    const controls = document.createElement("div");
    controls.className = "trade-controls";
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.max = "50";
    quantityInput.value = "1";
    quantityInput.className = "trade-qty";
    const buyBtn = document.createElement("button");
    buyBtn.textContent = "Buy";
    buyBtn.addEventListener("click", () => {
      sendAction({
        type: "buyGoods",
        goodId: good.id,
        quantity: Number(quantityInput.value) || 1
      });
    });
    const sellBtn = document.createElement("button");
    sellBtn.textContent = "Sell";
    sellBtn.addEventListener("click", () => {
      sendAction({
        type: "sellGoods",
        goodId: good.id,
        quantity: Number(quantityInput.value) || 1
      });
    });
    controls.appendChild(quantityInput);
    controls.appendChild(buyBtn);
    controls.appendChild(sellBtn);
    card.appendChild(controls);
    tradeListEl.appendChild(card);
  });
};

const renderMissions = (missions) => {
  if (!missions || !world) {
    return;
  }
  missionBoardEl.innerHTML = "";
  availableMissions = missions;
  if (!availableMissions.find((mission) => mission.id === highlightedMissionId)) {
    highlightedMissionId = availableMissions[0]?.id ?? null;
  }

  const renderMissionDetail = () => {
    if (!missionDetailEl) {
      return;
    }
    const mission = availableMissions.find((item) => item.id === highlightedMissionId);
    if (!mission) {
      missionDetailEl.innerHTML = "<p>Select a mission to review details.</p>";
      return;
    }
    const from = getPlanetById(mission.fromPlanetId);
    const to = getPlanetById(mission.toPlanetId);
    const destinationSystem = getSystemById(to?.systemId);
    missionDetailEl.innerHTML = `
      <h4>${mission.title}</h4>
      <p>Type: ${mission.type ?? "delivery"} · Cargo: ${mission.cargoSpace ?? 0}</p>
      <p>${mission.description}</p>
      <p>Route: ${from?.name ?? "Unknown"} → ${to?.name ?? "Unknown"}</p>
      <p>Destination system: ${destinationSystem?.name ?? "Unknown"}</p>
      <p>Reward: ${formatCredits(mission.reward)}</p>
    `;
    const acceptBtn = document.createElement("button");
    acceptBtn.textContent = "Accept";
    acceptBtn.addEventListener("click", () => {
      sendAction({ type: "acceptMission", missionId: mission.id });
    });
    missionDetailEl.appendChild(acceptBtn);
  };

  missions.forEach((mission) => {
    const card = document.createElement("div");
    card.className = "list-item mission-item";
    if (mission.id === highlightedMissionId) {
      card.classList.add("selected");
    }
    const from = getPlanetById(mission.fromPlanetId);
    const to = getPlanetById(mission.toPlanetId);
    card.innerHTML = `
      <h4>${mission.title}</h4>
      <p>${mission.type ?? "delivery"} · Cargo: ${mission.cargoSpace ?? 0}</p>
      <p>${from?.name ?? "Unknown"} → ${to?.name ?? "Unknown"}</p>
    `;
    card.addEventListener("click", () => {
      highlightedMissionId = mission.id;
      renderMissions(availableMissions);
      if (mapOpen) {
        renderMap();
      }
    });
    missionBoardEl.appendChild(card);
  });

  renderMissionDetail();
  if (mapOpen) {
    renderMap();
  }
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

const renderMissionLog = () => {
  if (!missionLogListEl) {
    return;
  }
  if (!player || !world) {
    missionLogListEl.innerHTML = "<p class=\"mission-log-empty\">Log in to view missions.</p>";
    return;
  }
  const activeMissions = (player.missions || []).filter(
    (mission) => mission.status === "active"
  );
  if (activeMissions.length === 0) {
    missionLogListEl.innerHTML = "<p class=\"mission-log-empty\">No active missions.</p>";
    return;
  }
  missionLogListEl.innerHTML = "";
  activeMissions.forEach((mission) => {
    const planet = getPlanetById(mission.toPlanetId);
    const system = planet ? getSystemById(planet.systemId) : null;
    const card = document.createElement("div");
    card.className = "list-item";
    card.innerHTML = `
      <h4>${mission.title}</h4>
      <p>Destination: ${system?.name ?? "Unknown System"} · ${planet?.name ?? "Unknown Planet"}</p>
      <p>Reward: ${formatCredits(mission.reward)}</p>
    `;
    missionLogListEl.appendChild(card);
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

const setDockedSection = (section) => {
  activeDockedSection = section;
  if (dockedMenuEl) {
    dockedMenuEl.classList.toggle("hidden", Boolean(section));
  }
  if (dockedBackBtn) {
    dockedBackBtn.classList.toggle("hidden", !section);
  }
  dockedSectionEls.forEach((el) => {
    const isActive = el.dataset.section === section;
    el.classList.toggle("hidden", !isActive);
  });
};

const updateDockedMenuAvailability = (planet) => {
  if (!planet) {
    dockedMenuButtons.forEach((button) => {
      if (button) {
        button.disabled = true;
      }
    });
    return;
  }
  if (dockedMenuMissionBtn) {
    dockedMenuMissionBtn.disabled = !planet.missionBoard;
  }
  if (dockedMenuOutfitterBtn) {
    dockedMenuOutfitterBtn.disabled = !planet.outfitter;
  }
  if (dockedMenuShipyardBtn) {
    dockedMenuShipyardBtn.disabled = !planet.shipyard;
  }
  if (dockedMenuTradingBtn) {
    dockedMenuTradingBtn.disabled = false;
  }
  if (dockedMenuBarBtn) {
    dockedMenuBarBtn.disabled = false;
  }
  if (activeDockedSection) {
    const disabledSection = dockedMenuButtons.find(
      (button) => button?.dataset.section === activeDockedSection && button.disabled
    );
    if (disabledSection) {
      setDockedSection(null);
    }
  }
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
  renderMissionLog();
  updateSecondaryStatus();
  updateMapRoute();
  if (mapOpen) {
    renderMap();
  }

  const docked = Boolean(player.planetId);
  dockedPanelEl.classList.toggle("hidden", !docked);

  if (docked) {
    const planet = getCurrentPlanet();
    if (player.planetId !== lastDockedPlanetId) {
      setDockedSection(null);
      lastDockedPlanetId = player.planetId;
    }
    updateDockedMenuAvailability(planet);
    if (planet?.missionBoard) {
      sendAction({ type: "requestMissions" });
    } else {
      missionBoardEl.innerHTML = "<p>No mission board at this planet.</p>";
      if (missionDetailEl) {
        missionDetailEl.innerHTML = "<p>Mission board unavailable.</p>";
      }
      availableMissions = [];
      highlightedMissionId = null;
    }

    sendAction({ type: "requestMarket" });

    if (planet?.outfitter) {
      renderOutfits();
      renderWeapons();
    } else {
      outfitListEl.innerHTML = "<p>Outfitter unavailable here.</p>";
      weaponListEl.innerHTML = "<p>Outfitter unavailable here.</p>";
      secondaryWeaponListEl.innerHTML = "<p>Outfitter unavailable here.</p>";
    }

    if (planet?.shipyard) {
      renderShipyard();
    } else {
      shipListEl.innerHTML = "<p>Shipyard access unavailable here.</p>";
    }
  } else {
    setDockedSection(null);
    lastDockedPlanetId = null;
    updateDockedMenuAvailability(null);
    missionBoardEl.innerHTML = "<p>Dock to access the mission board.</p>";
    if (missionDetailEl) {
      missionDetailEl.innerHTML = "<p>Dock to access the mission board.</p>";
    }
    outfitListEl.innerHTML = "<p>Dock to access the outfitter.</p>";
    weaponListEl.innerHTML = "<p>Dock to access the outfitter.</p>";
    secondaryWeaponListEl.innerHTML = "<p>Dock to access the outfitter.</p>";
    shipListEl.innerHTML = "<p>Dock to access the shipyard.</p>";
    cargoSummaryEl.innerHTML = "<p>Dock to access trading services.</p>";
    tradeListEl.innerHTML = "<p>Dock to access trading services.</p>";
    availableMissions = [];
    highlightedMissionId = null;
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
    presenceSnapshots.clear();
    targetLockId = null;
    pilotNameDisplayEl.textContent = "";
    showLoginOverlay("Connection lost. Please reconnect.");
  });

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === "loginRequired") {
      isLoggedIn = false;
      player = null;
      presencePlayers = [];
      presenceSnapshots.clear();
      projectiles.length = 0;
      explosions.length = 0;
      targetLockId = null;
      setMissionLogOpen(false);
      showLoginOverlay(payload.message || "");
      return;
    }
    if (payload.type === "loginError") {
      showLoginOverlay(payload.message);
      return;
    }
    if (payload.type === "init") {
      world = payload.world;
      loadShipSprites(world?.ships || []);
      player = payload.player;
      selectedSecondaryIndex = 0;
      updatePresencePlayers(payload.players || []);
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
      updatePresencePlayers(payload.players || []);
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
      const weaponIds = Array.isArray(payload.weapons) ? payload.weapons : [];
      const ownerId = payload.shooterId || null;
      spawnProjectiles(originX, originY, angle, weaponIds, ownerId, {
        allowFallback: false,
        targetId: payload.targetId || null
      });
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
        presenceSnapshots.clear();
        projectiles.length = 0;
        explosions.length = 0;
        targetLockId = null;
        showLoginOverlay("Ship destroyed. Re-login to respawn.");
      }
    }
    if (payload.type === "missions") {
      renderMissions(payload.missions);
    }
    if (payload.type === "market") {
      renderMarket(payload.market || []);
    }
  });
};

undockBtn.addEventListener("click", () => {
  sendAction({ type: "undock" });
});

completeBtn.addEventListener("click", () => {
  sendAction({ type: "completeMissions" });
});

dockedMenuButtons.forEach((button) => {
  if (!button) {
    return;
  }
  button.addEventListener("click", () => {
    if (button.disabled) {
      return;
    }
    setDockedSection(button.dataset.section ?? null);
  });
});

if (dockedBackBtn) {
  dockedBackBtn.addEventListener("click", () => {
    setDockedSection(null);
  });
}

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
  if (event.key === "i" || event.key === "I") {
    event.preventDefault();
    setMissionLogOpen();
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    if (!mapOpen && !event.repeat) {
      cycleTargetLock();
    }
    return;
  }
  if (event.key === "r" || event.key === "R") {
    event.preventDefault();
    if (!mapOpen && !event.repeat) {
      lockNearestHostileTarget();
    }
    return;
  }
  if (event.key === "w" || event.key === "W") {
    event.preventDefault();
    if (!mapOpen && !event.repeat) {
      cycleSecondaryWeapon();
    }
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
      const fired = fireSecondaryWeapons();
      if (fired) {
        setWeaponStatus("Secondary weapons fired.");
      }
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
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "a", "s", "d"].includes(event.key)) {
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
mapCanvas.addEventListener("mousedown", handleMapPanStart);
mapCanvas.addEventListener("mousemove", handleMapPanMove);
mapCanvas.addEventListener("wheel", handleMapWheel, { passive: false });
window.addEventListener("mouseup", handleMapPanEnd);
mapCanvas.addEventListener("mouseleave", handleMapPanEnd);
closeMapBtn.addEventListener("click", () => setMapOpen(false));
if (closeMissionLogBtn) {
  closeMissionLogBtn.addEventListener("click", () => setMissionLogOpen(false));
}
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
}, 20);
