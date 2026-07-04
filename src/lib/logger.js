const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  debug(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.debug) {
      console.debug(formatMessage("debug", message, meta));
    }
  },
  info(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.info) {
      console.info(formatMessage("info", message, meta));
    }
  },
  warn(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.warn) {
      console.warn(formatMessage("warn", message, meta));
    }
  },
  error(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.error) {
      console.error(formatMessage("error", message, meta));
    }
  },
};
