import type { Logger } from "../../../logger";
import type { ContextType } from "../types";

import { v4 as uuidv4 } from "uuid";
import { cherryPickCommits } from "github-cherry-pick";
import { postComment, sendNotManagedHelp } from "../util/post-comment";
import { isStackAttackPullRequest } from "../util/stacks";

const generateUniqueRef = (ref: string): string => `${ref}-${uuidv4()}`;
const getHeadRef = (ref: string): string => `heads/${ref}`;
const getFullyQualifiedRef = (ref: string): string => `refs/${getHeadRef(ref)}`;

async function createTemporaryRef(
  context: ContextType,
  ref: string,
  sha: string
): Promise<{
  deleteTemporaryRef: () => Promise<void>;
  temporaryRef: string;
}> {
  const temporaryRef = generateUniqueRef(ref);
  await context.github.git.createRef(
    context.repo({
      ref: getFullyQualifiedRef(temporaryRef),
      sha,
    })
  );
  return {
    async deleteTemporaryRef() {
      await context.github.git.deleteRef(
        context.repo({
          ref: getHeadRef(temporaryRef),
        })
      );
    },
    temporaryRef,
  };
}

async function withTemporaryRef<T>(
  context: ContextType,
  ref: string,
  sha: string,
  action: (ref: string) => Promise<T>
): Promise<T> {
  const { deleteTemporaryRef, temporaryRef } = await createTemporaryRef(
    context,
    ref,
    sha
  );

  try {
    return await action(temporaryRef);
  } finally {
    await deleteTemporaryRef();
  }
}

async function stackAttackRebase(
  context: ContextType,
  logger: Logger,
  pullRequestNumber: number
): Promise<string> {
  const {
    data: {
      base: { ref: baseRef },
      head: { ref: headRef, sha: initialHeadSha },
    },
  } = await context.github.pulls.get(
    context.repo({
      pull_number: pullRequestNumber,
    })
  );

  const { payload } = context;

  // The SHA given by GitHub for the base branch is not always up to date.
  // A request is made to fetch the actual one.
  logger.info({ payload, headRef, initialHeadSha }, "Getting ref for rebase");
  const {
    data: {
      object: { sha: initialBaseSha },
    },
  } = await context.github.git.getRef(
    context.repo({
      ref: getHeadRef(baseRef),
    })
  );

  return withTemporaryRef(
    context,
    `stack-attack-bot/rebase-${pullRequestNumber}`,
    initialBaseSha, // Add temp ref to tip of base branch
    async (temporaryRef) => {
      // Cherry pick head commit onto temp ref
      logger.info(
        { payload, headRef, initialHeadSha, temporaryRef },
        "Cherry picking commit"
      );
      const newHeadSha = await cherryPickCommits({
        octokit: context.github,
        owner: context.issue().owner,
        repo: context.issue().repo,
        commits: [initialHeadSha],
        head: temporaryRef,
      });

      // Reset head ref to the new commit
      logger.info(
        { payload, headRef, initialHeadSha, newHeadSha },
        "Updating ref"
      );
      await context.github.git.updateRef(
        context.repo({
          ref: getHeadRef(headRef),
          sha: newHeadSha,
          force: true,
        })
      );

      return newHeadSha;
    }
  );
}

export async function handleRebaseCommand(
  context: ContextType,
  logger: Logger
): Promise<void> {
  const { payload } = context;
  const {
    comment: { id: commentId },
    issue: { state, body },
  } = payload;

  // Ignore closed PRs
  if (state !== "open") {
    await postComment(context, "Oops, we won't rebase closed PRs.");
    return;
  }

  // TODO: Check if commenter has write rights

  // Ignore if PR is not created by Stack Attack
  if (!isStackAttackPullRequest(body)) {
    await sendNotManagedHelp(context);
    return;
  }

  // Rebase
  logger.info({ payload }, "Rebasing pull request");
  const [, newHeadSha] = await Promise.all([
    context.github.reactions.createForIssueComment(
      context.repo({
        comment_id: commentId,
        content: "+1",
      })
    ),
    stackAttackRebase(context, logger, payload.issue.number),
  ]);
  logger.info({ payload, newHeadSha }, "Rebased pull request");
}
