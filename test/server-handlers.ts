import { rest } from "msw";

export const handlers = [
  rest.post(
    "https://api.github.com/app/installations/2/access_tokens",
    (_req, res, ctx) => {
      return res(ctx.json({ token: "test" }));
    }
  ),
];
