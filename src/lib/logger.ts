type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function currentLevel(): LogLevel {
  const envLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined)?.toLowerCase() as LogLevel | undefined;
  if (envLevel && LEVELS[envLevel] !== undefined) return envLevel;
  return import.meta.env.DEV ? 'debug' : 'warn';
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[currentLevel()];
}

function format(scope: string, level: LogLevel, message: string) {
  const ts = new Date().toISOString();
  return `[${ts}] [${scope}] ${level.toUpperCase()}: ${message}`;
}

export interface Logger {
  scope: string;
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

export function createLogger(scope: string): Logger {
  const base = (level: LogLevel) => (message: string, ...args: any[]) => {
    if (!shouldLog(level)) return;
    const line = format(scope, level, message);
    switch (level) {
      case 'debug': console.debug(line, ...args); break;
      case 'info': console.info(line, ...args); break;
      case 'warn': console.warn(line, ...args); break;
      case 'error': console.error(line, ...args); break;
    }
    // Keep a lightweight in-memory buffer for quick inspection
    try {
      const w = window as any;
      w.__APP_LOGS__ = w.__APP_LOGS__ || [];
      w.__APP_LOGS__.push({ ts: Date.now(), scope, level, message, args });
      if (w.__APP_LOGS__.length > 1000) w.__APP_LOGS__.shift();
    } catch {}
  };
  return {
    scope,
    debug: base('debug'),
    info: base('info'),
    warn: base('warn'),
    error: base('error'),
  };
}

export function installGlobalErrorHandlers(scope = 'global') {
  const logger = createLogger(scope);
  window.addEventListener('error', (event) => {
    logger.error('Unhandled error', event.error || event.message, event.filename, event.lineno, event.colno);
  });
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason);
  });
}
