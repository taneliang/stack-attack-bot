import type { ApplicationFunction } from "probot";
import type { Logger } from "./logger";

import rootLogger from "./logger";

export const makeAppFunction = (logger: Logger): ApplicationFunction => (
  app
) => {
  app.on("issues.opened", async (context) => {
    const { event, payload } = context;
    logger.debug({ event, payload }, "Got event");
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    await context.github.issues.createComment(issueComment);
  });

  // TODO: Detect completion of required status checks

  app.on("issue_comment", async (context) => {
    const { event, payload } = context;
    if (payload.action === "deleted") {
      return; // Don't care about deletions
    }
    logger.debug({ event, payload }, "Got event");
    // TODO: Ignore if the comment is not addressing us
    // TODO: Check if commenter has write rights
    // TODO: Parse command
    // TODO: Begin executing command if it's valid
  });

  app.on("pull_request.closed", async (context) => {
    const { event, payload } = context;
    logger.debug({ event, payload }, "Got event");
    // TODO: Check if we were landing this PR.
    // TODO: If we were landing this PR, ensure that the PR was actually landed and not closed unmerged
    // TODO: Find next PR in stack
    // TODO: Check if next PR in stack is being landed
    // TODO: If next PR in stack is being landed, rebase it
  });
};

module.exports = makeAppFunction(rootLogger);
