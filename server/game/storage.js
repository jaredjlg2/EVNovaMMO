const fs = require("fs");
const path = require("path");
const logger = require("../logger");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "pilots.json");

// In-memory write-through cache and async write queue.
// Reads are served from the cache; writes are batched and flushed asynchronously
// to avoid blocking the game loop with synchronous I/O.
let pilotsCache = null;
let writeQueued = false;

const ensureDataDir = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const loadPilots = () => {
  if (pilotsCache !== null) {
    return pilotsCache;
  }
  ensureDataDir();
  if (!fs.existsSync(dataFile)) {
    pilotsCache = {};
    return pilotsCache;
  }
  try {
    const raw = fs.readFileSync(dataFile, "utf8");
    pilotsCache = JSON.parse(raw);
  } catch (error) {
    logger.error("Failed to parse pilots.json", { err: error.message });
    pilotsCache = {};
  }
  return pilotsCache;
};

// Flush the in-memory cache to disk asynchronously (write-to-temp + rename for atomicity).
const flushToDisk = () => {
  if (!writeQueued) {
    return;
  }
  writeQueued = false;
  const snapshot = JSON.stringify(pilotsCache, null, 2);
  const tmpFile = dataFile + ".tmp";
  ensureDataDir();
  fs.writeFile(tmpFile, snapshot, "utf8", (writeErr) => {
    if (writeErr) {
      logger.error("Failed to write pilots.tmp", { err: writeErr.message });
      return;
    }
    fs.rename(tmpFile, dataFile, (renameErr) => {
      if (renameErr) {
        logger.error("Failed to rename pilots.tmp to pilots.json", { err: renameErr.message });
      }
    });
  });
};

// Schedule an async flush after the current tick completes.
const scheduleFlush = () => {
  if (!writeQueued) {
    writeQueued = true;
    setImmediate(flushToDisk);
  }
};

const loadPilot = (name) => {
  const pilots = loadPilots();
  return pilots[name] || null;
};

const savePilot = (name, state) => {
  loadPilots(); // ensure cache is initialised
  pilotsCache[name] = state;
  scheduleFlush();
};

module.exports = {
  loadPilot,
  savePilot
};
