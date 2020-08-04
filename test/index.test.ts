import type { ResponseResolver } from "msw/lib/types";

import fs from "fs";
import path from "path";

import { Probot } from "probot";
import { server, rest } from "../test/server";
import { mockLogger } from "../src/logger/mockLogger";
import { makeAppFunction } from "../src/makeAppFunction";

describe("Stack Attack app", () => {
  let probot: Probot;
  let mockCert: string;

  beforeAll((done) => {
    fs.readFile(path.join(__dirname, "fixtures/mock-cert.pem"), (err, cert) => {
      if (err) return done.fail(err);
      mockCert = cert.toString();
      done();
    });
  });

  beforeEach(() => {
    probot = new Probot({ id: 123, cert: mockCert });
    probot.load(makeAppFunction(mockLogger()));
  });

  test("creates a comment when an issue is opened", async () => {
    const owner = "sttack";
    const repo = "watermelons";

    const mockCommentPostHandler: ResponseResolver = jest.fn((req, res) => {
      // Expect a comment to be posted
      expect(req.body).toMatchObject({
        body: "Thanks for opening this issue!",
      });
      return res();
    });

    server.use(
      rest.post(
        `https://api.github.com/repos/${owner}/${repo}/issues/1/comments`,
        mockCommentPostHandler
      )
    );

    await probot.receive({
      id: "1234",
      name: "issues",
      payload: {
        action: "opened",
        issue: {
          number: 1,
          user: {
            login: owner,
          },
        },
        repository: {
          name: repo,
          owner: {
            login: owner,
          },
        },
      },
    });

    // Expect 1 comment to be posted
    expect(mockCommentPostHandler).toHaveBeenCalledTimes(1);
  });
});
