import type { Logger } from "../../../logger";
import type { ContextType } from "../types";

import { rebasePullRequest } from "github-rebase";
import { postComment } from "../util/post-comment";

export async function handleRebaseCommand(
  context: ContextType,
  logger: Logger
): Promise<void> {
  await postComment(context, "Rebase!");

  const { payload } = context;
  logger.info({ payload }, "Rebasing pull request");
  const newHeadSha = await rebasePullRequest({
    octokit: context.github,
    owner: context.issue().owner,
    repo: context.issue().repo,
    pullRequestNumber: payload.issue.number,
  });
  logger.info({ payload, newHeadSha }, "Rebased pull request");
}
