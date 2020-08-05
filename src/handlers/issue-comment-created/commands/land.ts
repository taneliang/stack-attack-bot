import type { Logger } from "../../../logger";
import type { ContextType, StackedPullRequest } from "../types";

import {
  extractStackFromDescription,
  sortedDependenciesOfPullRequest,
} from "../util/stacks";
import { sendNotManagedHelp, postComment } from "../util/post-comment";

function announceLanding(
  context: ContextType,
  stack: StackedPullRequest[]
): Promise<void> {
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

export async function handleLandCommand(
  context: ContextType,
  logger: Logger
): Promise<void> {
  const { body, number } = context.payload.issue;

  // TODO: Check if commenter has write rights

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

  // await landPullRequest()
}
