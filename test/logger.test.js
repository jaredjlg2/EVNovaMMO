/**
 * Unit tests for the logger module.
 * Verifies that output is valid JSON and that log levels filter correctly.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

test("logger emits valid JSON to stdout for info level", () => {
  // Capture stdout
  const lines = [];
  const origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (data) => {
    lines.push(data);
    return true;
  };

  const logger = require("../server/logger");
  logger.info("test message", { key: "value" });

  process.stdout.write = origWrite;

  assert.ok(lines.length > 0, "Expected at least one line written to stdout");
  const last = lines[lines.length - 1].trim();
  let parsed;
  assert.doesNotThrow(() => {
    parsed = JSON.parse(last);
  }, "Logger output should be valid JSON");
  assert.equal(parsed.level, "info");
  assert.equal(parsed.msg, "test message");
  assert.equal(parsed.key, "value");
  assert.ok(parsed.ts, "Should include a timestamp field");
});

test("logger emits valid JSON to stderr for error level", () => {
  const lines = [];
  const origWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (data) => {
    lines.push(data);
    return true;
  };

  delete require.cache[require.resolve("../server/logger")];
  const logger = require("../server/logger");
  logger.error("something went wrong", { err: "details" });

  process.stderr.write = origWrite;

  assert.ok(lines.length > 0);
  const last = lines[lines.length - 1].trim();
  const parsed = JSON.parse(last);
  assert.equal(parsed.level, "error");
  assert.equal(parsed.msg, "something went wrong");
});

test("logger suppresses debug output at default info level", () => {
  const lines = [];
  const origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (data) => {
    lines.push(data);
    return true;
  };

  delete require.cache[require.resolve("../server/logger")];
  const logger = require("../server/logger");
  logger.debug("debug only");

  process.stdout.write = origWrite;

  const debugLines = lines.filter((l) => {
    try {
      return JSON.parse(l.trim()).level === "debug";
    } catch (_) {
      return false;
    }
  });
  assert.equal(debugLines.length, 0, "debug lines should be suppressed at info level");
});
