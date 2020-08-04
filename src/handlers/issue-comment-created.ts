import type { Context } from "probot";
import type { WebhookPayloadIssueComment } from "@octokit/webhooks";
import type { Logger } from "../logger";

export const event = "issue_comment.created";

const commandAddressPrefix = "@sttack ";

const helpText = `HEY! Thanks for pinging [Stack Attack](https://github.com/taneliang/stack-attack).

Here's how you can use me:

* Ask me to land a stack of Stack Attack PRs: \`@sttack land\`
* Ask me to rebase a stack of Stack Attack PRs: \`@sttack rebase\`

🥞
`;

export const handler = (logger: Logger) => async (
  context: Context<WebhookPayloadIssueComment>
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
  if (!commentBody.startsWith(commandAddressPrefix)) return;

  // Parse command
  const commandComponents = commentBody
    .substr(commandAddressPrefix.length)
    .split("\n")
    .join(" ")
    .split(" ");

  async function sendHelp() {
    const issueComment = context.issue({
      body: helpText,
    });
    await context.github.issues.createComment(issueComment);
  }

  if (commandComponents.length === 0) {
    return sendHelp();
  }

  const [command, ...otherArguments] = commandComponents;

  switch (command) {
    case "land": {
      logger.debug("Land command received");
      // TODO: Execute land
      // TODO: Check if commenter has write rights
      const issueComment = context.issue({
        body: "Landing!",
      });
      await context.github.issues.createComment(issueComment);
      return;
    }
    case "rebase": {
      logger.debug(otherArguments, "Rebase command received");
      // TODO: Execute rebase
      const issueComment = context.issue({
        body: "Rebase!",
      });
      await context.github.issues.createComment(issueComment);
      return;
    }
  }

  return sendHelp();
};
