// Structured logging. Never logs secrets (API keys, password hashes, tokens)
// or raw request/response bodies from external providers beyond what's needed
// to debug — only status/duration/error.

type LogFields = {
  userId?: string;
  projectId?: string;
  jobId?: string;
  provider?: string;
  operation?: string;
  status?: string;
  durationMs?: number;
  error?: string;
  [key: string]: unknown;
};

const REDACT_KEYS = new Set([
  "apiKey",
  "api_key",
  "password",
  "passwordHash",
  "secret",
  "token",
  "authorization",
]);

function redact(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = REDACT_KEYS.has(k) ? "[redacted]" : v;
  }
  return out;
}

function emit(level: "info" | "warn" | "error", message: string, fields: LogFields = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...redact(fields),
  };
  // eslint-disable-next-line no-console
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(JSON.stringify(entry));
}

export const logger = {
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};
