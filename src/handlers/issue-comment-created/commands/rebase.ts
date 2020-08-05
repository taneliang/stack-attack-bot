import type { ContextType } from "../types";

import { postComment } from "../util/post-comment";

export async function handleRebaseCommand(context: ContextType): Promise<void> {
  // TODO: Execute rebase
  await postComment(context, "Rebase!");
}
