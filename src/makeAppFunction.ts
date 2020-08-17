import type { ApplicationFunction } from "probot";
import type { Logger } from "./logger";

import * as issueCommentCreatedHandler from "./handlers/issue-comment-created";

const handlers = [issueCommentCreatedHandler];

export const makeAppFunction = (logger: Logger): ApplicationFunction => (
  app
) => {
  handlers.forEach((handler) => app.on(handler.event, handler.handler(logger)));

  app.on("pull_request.closed", async (context) => {
    const { event, payload } = context;
    logger.debug({ event, payload }, "Got event");
    // TODO: Check if we were landing this PR.
    // TODO: If we were landing this PR, ensure that the PR was actually landed and not closed unmerged
    // TODO: Find next PR in stack
    // TODO: Check if next PR in stack is being landed
    // TODO: If next PR in stack is being landed, rebase it
  });

  app.on("pull_request", async (context) => {
    const { event, payload } = context;
    logger.debug({ event, payload }, "Got event");
  });
  app.on("check_run", async (context) => {
    const { event, payload } = context;
    logger.debug({ event, payload }, "Got event");
  });
  app.on("check_suite", async (context) => {
    const { event, payload } = context;
    logger.debug({ event, payload }, "Got event");
  });
  app.on("push", async (context) => {
    const { event, payload } = context;
    logger.debug({ event, payload }, "Got event");
  });
};
