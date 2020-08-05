import type { Context } from "probot";
import type { WebhookPayloadIssueComment } from "@octokit/webhooks";

export type ContextType = Context<WebhookPayloadIssueComment>;

export type StackedPullRequest = {
  number: number;
  isCurrent: boolean;
  dependencies: number[];
};
