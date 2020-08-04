import type { Context } from "probot";
import type { WebhookPayloadIssueComment } from "@octokit/webhooks";
import type { Logger } from "../logger";

import nullthrows from "nullthrows";

export const event = "issue_comment.created";

const commandAddressPrefix = "@sttack ";

const helpText = `HEY! Thanks for pinging [Stack Attack](https://github.com/taneliang/stack-attack).

Here's how you can use me:

* Ask me to land a stack of Stack Attack PRs: \`@sttack land\`
* Ask me to rebase a stack of Stack Attack PRs: \`@sttack rebase\`

🥞
`;

type StackedPullRequest = {
  number: number;
  isCurrent: boolean;
  dependencies: number[];
};

function extractStackFromDescription(
  description: string,
  logger: Logger
): Map<number, StackedPullRequest> | null {
  if (!description.startsWith("Stack PR")) {
    return null;
  }

  // TODO: Build tree instead of just a stack
  const lines = description.split("\n").slice(1); // Drop first "Stack PR..." line
  const numberToPullRequestMap = new Map<number, StackedPullRequest>();
  let lastPullNumber: number | null = null;
  for (const line of lines) {
    const matches = /^- (?<initialBoldStars>\*\*)?#(?<pullNumber>\d+?) (?<pullTitle>.+?)(?<trailingBoldStars>\*\*)?$/.exec(
      line
    );
    if (!matches) {
      break;
    }

    const groups = nullthrows(
      matches.groups,
      "groups must exist if there are matches"
    );

    if (groups.initialBoldStars !== groups.trailingBoldStars) {
      logger.debug({ line, description }, "Malformed description line");
      break; // Malformed description
    }

    let number;
    try {
      number = parseInt(groups.pullNumber, 10);
    } catch (e) {
      logger.debug({ groups }, "Malformed pullNumber");
      break;
    }

    const isCurrent = !!groups.initialBoldStars;
    const dependencies = lastPullNumber !== null ? [lastPullNumber] : [];

    numberToPullRequestMap.set(number, { number, isCurrent, dependencies });

    lastPullNumber = number;
  }

  return numberToPullRequestMap;

  // TODO: Use serialized tree data stored in the description, once we generate them
}

function sortedDependenciesOfPullRequest(
  pullRequest: StackedPullRequest,
  stack: Map<number, StackedPullRequest>
): StackedPullRequest[] {
  const sortedStack: StackedPullRequest[] = [];
  const nextPullRequests = [pullRequest];

  while (nextPullRequests.length > 0) {
    const [nextPullRequest] = nextPullRequests.splice(0, 1);
    sortedStack.push(nextPullRequest);
    // NOTE: This is not a correct topographical sort and can break if 2 PRs depend on one PR.
    nextPullRequest.dependencies.forEach((dependencyNumber) =>
      nextPullRequests.push(nullthrows(stack.get(dependencyNumber)))
    );
  }

  return sortedStack;
}

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

  async function sendGenericHelp() {
    const issueComment = context.issue({
      body: helpText,
    });
    await context.github.issues.createComment(issueComment);
  }
  async function sendNotManagedHelp() {
    const issueComment = context.issue({
      body:
        "Hey! Looks like this PR isn't managed by [Stack Attack](https://github.com/taneliang/stack-attack), so we can't land this for you.",
    });
    await context.github.issues.createComment(issueComment);
  }

  if (commandComponents.length === 0) {
    return sendGenericHelp();
  }

  const [command, ...otherArguments] = commandComponents;

  switch (command) {
    case "land": {
      logger.debug("Land command received");

      const { body, number } = issue;
      // TODO: Execute land
      // TODO: Check if commenter has write rights
      const stackMap = extractStackFromDescription(body, logger);
      if (!stackMap) {
        return sendNotManagedHelp();
        break;
      }

      const pullRequestInStack = stackMap.get(number);
      if (!pullRequestInStack) {
        return sendNotManagedHelp();
        break;
      }

      const stackBelowThisPullRequest = sortedDependenciesOfPullRequest(
        pullRequestInStack,
        stackMap
      );

      // TODO: Handle case where PR has multiple dependencies

      // TODO: Walk stack to find PRs that actually need merging

      // TODO: Limit the number of PRs in the stack to prevent DDOS

      const issueComment = context.issue({
        body: `Landing!\n\n\`\`\`\n${stackBelowThisPullRequest
          .map(({ number }) => `↓ #${number}`)
          .join("\n")}\n* base branch\n\`\`\``,
      });
      await context.github.issues.createComment(issueComment);
      break;
    }

    case "rebase": {
      logger.debug(otherArguments, "Rebase command received");
      // TODO: Execute rebase
      const issueComment = context.issue({
        body: "Rebase!",
      });
      await context.github.issues.createComment(issueComment);
      break;
    }

    default:
      await sendGenericHelp();
      break;
  }
};
