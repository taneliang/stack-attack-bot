import type { ContextType } from "../types";
import { commandAddressPrefix } from "./commandAddressPrefix";

export async function postComment(
  context: ContextType,
  body: string
): Promise<void> {
  const issueComment = context.issue({ body });
  await context.github.issues.createComment(issueComment);
}

export function sendGenericHelp(context: ContextType): Promise<void> {
  return postComment(
    context,
    `HEY! Thanks for pinging [STACK ATTACK](https://github.com/taneliang/stack-attack)!

I dare you – comment \`${commandAddressPrefix}rebase\` and I'll rebase this stacked pull request! 🥞`
  );
}

export function sendNotManagedHelp(context: ContextType): Promise<void> {
  return postComment(
    context,
    "Hey! Looks like this PR isn't managed by [Stack Attack](https://github.com/taneliang/stack-attack), so we can't do this for you."
  );
}
