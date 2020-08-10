import type { StackedPullRequest } from "../types";
import type { Logger } from "../../../logger";

import nullthrows from "nullthrows";

export function isStackAttackPullRequest(description: string): boolean {
  return description.startsWith("Stack PR");
}

export function extractStackFromDescription(
  description: string,
  logger: Logger
): Map<number, StackedPullRequest> | null {
  if (!isStackAttackPullRequest(description)) {
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

export function sortedDependenciesOfPullRequest(
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
