const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "pilots.json");

const ensureDataFile = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({}), "utf8");
  }
};

const loadPilots = () => {
  ensureDataFile();
  const raw = fs.readFileSync(dataFile, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse pilots.json", error);
    return {};
  }
};

const savePilots = (pilots) => {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(pilots, null, 2), "utf8");
};

const loadPilot = (name) => {
  const pilots = loadPilots();
  return pilots[name] || null;
};

const savePilot = (name, state) => {
  const pilots = loadPilots();
  pilots[name] = state;
  savePilots(pilots);
};

module.exports = {
  loadPilot,
  savePilot
};
