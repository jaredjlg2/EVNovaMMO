/**
 * Unit tests for the player module.
 * Validates that createPlayer produces correct initial state and
 * that saved state is merged properly.
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createPlayer } = require("../server/game/player");

test("createPlayer produces valid initial state", () => {
  const player = createPlayer({ id: "p1", name: "Nova-1" });
  assert.equal(player.id, "p1");
  assert.equal(player.name, "Nova-1");
  assert.equal(player.credits, 5000);
  assert.equal(player.systemId, "sol");
  assert.equal(player.planetId, null);
  assert.ok(Array.isArray(player.weapons));
  assert.ok(player.weapons.length > 0, "Should have at least one starter weapon");
  assert.ok(Array.isArray(player.missions));
  assert.ok(Array.isArray(player.cargo));
  assert.ok(Array.isArray(player.escorts));
  assert.ok(typeof player.reputation === "object");
  assert.ok(typeof player.story === "object");
});

test("createPlayer merges savedState credits correctly", () => {
  const savedState = { credits: 99999 };
  const player = createPlayer({ id: "p2", name: "Nova-2", savedState });
  assert.equal(player.credits, 99999);
});

test("createPlayer merges savedState systemId correctly", () => {
  const savedState = { systemId: "orion", planetId: "deneb_prime" };
  const player = createPlayer({ id: "p3", name: "Nova-3", savedState });
  assert.equal(player.systemId, "orion");
  assert.equal(player.planetId, "deneb_prime");
});

test("createPlayer initialises story arcs from base data when savedState has none", () => {
  const player = createPlayer({ id: "p4", name: "Nova-4" });
  assert.ok(typeof player.story.arcs === "object");
  // At least one arc should be defined
  assert.ok(Object.keys(player.story.arcs).length > 0);
});

test("createPlayer merges partial story flags from savedState", () => {
  const savedState = {
    story: {
      flags: { illegalTech: true }
    }
  };
  const player = createPlayer({ id: "p5", name: "Nova-5", savedState });
  assert.equal(player.story.flags.illegalTech, true);
  // Other flags should still have defaults
  assert.equal(player.story.flags.hypergateAccess, false);
});

test("createPlayer sets legalStatus from savedState", () => {
  const savedState = { legalStatus: 42 };
  const player = createPlayer({ id: "p6", name: "Nova-6", savedState });
  assert.equal(player.legalStatus, 42);
});

test("createPlayer defaults legalStatus to 0 when not in savedState", () => {
  const player = createPlayer({ id: "p7", name: "Nova-7" });
  assert.equal(player.legalStatus, 0);
});
