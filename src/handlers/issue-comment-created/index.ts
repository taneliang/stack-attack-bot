import type { Logger } from "../../logger";
import type { ContextType } from "./types";

import { handleLandCommand } from "./commands/land";
import { handleRebaseCommand } from "./commands/rebase";
import { sendGenericHelp } from "./util/post-comment";
import { commandAddressPrefix } from "./util/commandAddressPrefix";

export const event = "issue_comment.created";

function parseCommandFromIssueDescription(
  body: string
): { command: string; otherArguments: string[] } | null {
  const commandComponents = body
    .substr(commandAddressPrefix.length)
    .split("\n")
    .map((component) => component.trim())
    .join(" ")
    .split(" ");

  if (commandComponents.length === 0) {
    return null;
  }

  const [command, ...otherArguments] = commandComponents;
  return { command, otherArguments };
}

export const handler = (logger: Logger) => async (
  context: ContextType
): Promise<void> => {
  const { event, payload } = context;
  logger.debug({ event, payload }, "Got event");

  const {
    comment: { body: commentBody },
    issue,
  } = payload;

  // Ignore if the comment is not on a PR
  // TODO: Send issue help if comment is not on a PR
  if (!Object.prototype.hasOwnProperty.call(issue, "pull_request")) return;

  // Ignore if the comment is not addressing us
  if (
    !commentBody.toLowerCase().startsWith(commandAddressPrefix.toLowerCase())
  ) {
    return;
  }

  // Parse command
  const commandAndArgumentsOrNull = parseCommandFromIssueDescription(
    commentBody
  );
  if (!commandAndArgumentsOrNull) {
    await sendGenericHelp(context);
    return;
  }
  const { command, otherArguments } = commandAndArgumentsOrNull;

  switch (command) {
    case "land":
      logger.info({ otherArguments }, "Land command received");
      return handleLandCommand(context, logger);
    case "rebase":
      logger.info(otherArguments, "Rebase command received");
      return handleRebaseCommand(context, logger);
    default:
      logger.info({ command, otherArguments }, "Unknown command received");
      return sendGenericHelp(context);
  }
};
