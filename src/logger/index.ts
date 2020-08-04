// Adapted from https://github.com/nusmodifications/nusmods/blob/efdc9a369269cbefede9111519215df9c506b5cd/scrapers/nus-v2/src/services/logger/index.ts

import path from "path";
import bunyan, { Stream } from "bunyan";

/* eslint-disable @typescript-eslint/no-explicit-any */

type LoggingFunction = {
  (error: Error, message?: string, ...params: any[]): void;
  (message: string, ...params: any[]): void;
  (data: Record<string, any>, message: string, ...params: any[]): void;
};

export interface Logger {
  trace: LoggingFunction;
  debug: LoggingFunction;
  info: LoggingFunction;
  warn: LoggingFunction;
  error: LoggingFunction;
  fatal: LoggingFunction;

  child(options: Record<string, any>): Logger;
}

/* eslint-enable */

const logRoot = path.join(__dirname, "../../../logs");

const streams: Stream[] =
  process.env.NODE_ENV === "production"
    ? [
        // TODO: Store logs somewhere in production
        // TODO: Log errors to Sentry. See:
        // https://github.com/nusmodifications/nusmods/blob/efdc9a369269cbefede9111519215df9c506b5cd/scrapers/nus-v2/src/services/logger/index.ts#L49
      ]
    : [
        {
          stream: process.stdout,
          level: "info",
        },
        {
          path: path.join(logRoot, "info.log"),
          level: "debug",
        },
        {
          path: path.join(logRoot, "errors.log"),
          level: "error",
        },
      ];

const rootLogger = bunyan.createLogger({
  name: "stack-attack-bot",
  streams,
});

export default rootLogger;
