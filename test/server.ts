import { setupServer } from "msw/node";
import { handlers } from "./server-handlers";

export { rest } from "msw";

export const server = setupServer(...handlers);
