import type { Logger } from "../../../logger";
import type { ContextType, StackedPullRequest } from "../types";

import {
  extractStackFromDescription,
  sortedDependenciesOfPullRequest,
} from "../util/stacks";
import { sendNotManagedHelp, postComment } from "../util/post-comment";

// async function getPullRequestInfo(context: ContextType): Promise<PullRequest> {
//   const derp = await context.github.pulls.get(context.issue());
//   derp.data.state;
// }

function announceLanding(
  context: ContextType,
  stack: StackedPullRequest[]
): Promise<void> {
  // TODO: Spray landing comments with hidden metadata
  return postComment(
    context,
    `Landing!\n\n\`\`\`\n${stack
      .map(
        ({ number }, index) =>
          `${index === stack.length - 1 ? "↓" : "|"} #${number}`
      )
      .join("\n")}\n* base branch\n\`\`\``
  );
}

async function landPullRequest(
  context: ContextType,
  logger: Logger,
  pullRequest: StackedPullRequest
): Promise<void> {
  logger.info({ pullRequest }, "Landing pull request");
  const { status, data } = await context.github.pulls.merge(
    context.issue({
      number: pullRequest.number,
      merge_method: "rebase",
    })
  );
  logger.info({ pullRequest, status, data }, "Landed pull request");
}

export async function handleLandCommand(
  context: ContextType,
  logger: Logger
): Promise<void> {
  const { body, number, state } = context.payload.issue;

  // Ignore closed PRs
  if (state !== "open") {
    await postComment(context, "Oops, we can't land closed PRs.");
    return;
  }

  // TODO: Check if commenter has write rights

  // TODO: Determine state of PR (closed, landing, rebasing) and metadata
  // (landing stack, rebasing stack, whole stack)

  const stackMap = extractStackFromDescription(body, logger);
  if (!stackMap) {
    await sendNotManagedHelp(context);
    return;
  }

  const pullRequestInStack = stackMap.get(number);
  if (!pullRequestInStack) {
    await sendNotManagedHelp(context);
    return;
  }

  const stackBelowThisPullRequest = sortedDependenciesOfPullRequest(
    pullRequestInStack,
    stackMap
  );

  // TODO: Handle case where PR has multiple dependencies

  // TODO: Walk stack to find PRs that actually need merging

  // TODO: Limit the number of PRs in the stack to prevent DDOS

  await announceLanding(context, stackBelowThisPullRequest);

  // COMBAK: Land last PR

  await landPullRequest(
    context,
    logger,
    stackBelowThisPullRequest[stackBelowThisPullRequest.length - 1]
  );
}
