// Adapted from https://github.com/nusmodifications/nusmods/blob/efdc9a369269cbefede9111519215df9c506b5cd/scrapers/nus-v2/src/services/logger/index.ts

import path from "path";
import bunyan, { Stream } from "bunyan";
import getSentryStream from "./SentryStream";
import bunyanLogentries from "bunyan-logentries";

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

function getDevelopmentStreams(): Stream[] {
  return [
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
}

function getProductionStreams(): Stream[] {
  const productionStreams: Stream[] = [];

  if (process.env.LOGENTRIES_TOKEN) {
    productionStreams.push({
      type: "raw",
      level: "info",
      stream: bunyanLogentries.createStream({
        token: process.env.LOGENTRIES_TOKEN,
      }),
    });
  } else {
    console.warn("LOGENTRIES_TOKEN is unset!");
  }

  if (process.env.SENTRY_DSN) {
    productionStreams.push({
      type: "raw",
      level: "error",
      stream: getSentryStream(),
    });
  } else {
    console.warn("SENTRY_DSN is unset!");
  }

  return productionStreams;
}

const logRoot = path.join(__dirname, "../../../logs");

const streams: Stream[] =
  process.env.NODE_ENV === "production"
    ? getProductionStreams()
    : getDevelopmentStreams();

const rootLogger = bunyan.createLogger({
  name: "stack-attack-bot",
  streams,
});

export default rootLogger;
