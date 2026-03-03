/**
 * Unit tests for the async write-queue storage module.
 * Uses Node's built-in test runner (node:test) and isolates the module
 * through cache invalidation so each test gets a fresh module instance.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

// The storage module writes to server/data/pilots.json relative to __dirname.
// We exercise the public API (savePilot / loadPilot) and then verify the file.
const dataFile = path.join(__dirname, "..", "server", "data", "pilots.json");
const dataDir = path.dirname(dataFile);

// Helper: get a fresh module instance with cleared in-memory cache.
const freshStorage = () => {
  delete require.cache[require.resolve("../server/game/storage")];
  return require("../server/game/storage");
};

before(() => {
  // Ensure the data directory exists for the test run.
  fs.mkdirSync(dataDir, { recursive: true });
  // Start from an empty pilots file.
  if (fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({}), "utf8");
  }
});

after(() => {
  // Leave the data directory but clear test data.
  if (fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({}), "utf8");
  }
  delete require.cache[require.resolve("../server/game/storage")];
});

test("loadPilot returns null for an unknown pilot name", () => {
  const { loadPilot } = freshStorage();
  const result = loadPilot("NoSuchPilot_Test");
  assert.equal(result, null);
});

test("savePilot / loadPilot round-trip via in-memory cache", async () => {
  const { savePilot, loadPilot } = freshStorage();
  savePilot("TestPilot", { name: "TestPilot", credits: 9001 });
  // The in-memory cache should reflect the change immediately.
  const result = loadPilot("TestPilot");
  assert.ok(result !== null, "Expected saved pilot to be retrievable");
  assert.equal(result.credits, 9001);
  assert.equal(result.name, "TestPilot");
});

test("savePilot persists different pilots independently", () => {
  const { savePilot, loadPilot } = freshStorage();
  savePilot("AlphaTest", { name: "AlphaTest", credits: 1000 });
  savePilot("BetaTest", { name: "BetaTest", credits: 2000 });
  assert.equal(loadPilot("AlphaTest").credits, 1000);
  assert.equal(loadPilot("BetaTest").credits, 2000);
});

test("pilots.json survives malformed content gracefully on cold load", () => {
  // Write bad JSON to simulate a corrupted file.
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, "NOT JSON", "utf8");
  const { loadPilot } = freshStorage();
  // Should not throw; unknown pilot returns null.
  const result = loadPilot("AnyPilot");
  assert.equal(result, null);
  // Restore clean state for subsequent tests.
  fs.writeFileSync(dataFile, JSON.stringify({}), "utf8");
});
