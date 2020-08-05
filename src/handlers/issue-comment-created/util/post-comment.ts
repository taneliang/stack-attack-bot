import type { ContextType } from "../types";

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
    `HEY! Thanks for pinging [Stack Attack](https://github.com/taneliang/stack-attack).

Here's how you can use me:

* Ask me to land a stack of Stack Attack PRs: \`@sttack land\`
* Ask me to rebase a stack of Stack Attack PRs: \`@sttack rebase\`

🥞
`
  );
}

export function sendNotManagedHelp(context: ContextType): Promise<void> {
  return postComment(
    context,
    "Hey! Looks like this PR isn't managed by [Stack Attack](https://github.com/taneliang/stack-attack), so we can't do this for you."
  );
}
