import type { ApplicationFunction } from "probot";

const main: ApplicationFunction = (app) => {
  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    await context.github.issues.createComment(issueComment);
  });
};

export = main;
