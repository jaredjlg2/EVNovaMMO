const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const levels = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = levels[LOG_LEVEL] ?? levels.info;

const write = (level, message, meta = {}) => {
  if ((levels[level] ?? 0) < currentLevel) {
    return;
  }
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...meta
  };
  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
};

const logger = {
  debug: (msg, meta) => write("debug", msg, meta),
  info: (msg, meta) => write("info", msg, meta),
  warn: (msg, meta) => write("warn", msg, meta),
  error: (msg, meta) => write("error", msg, meta)
};

module.exports = logger;
