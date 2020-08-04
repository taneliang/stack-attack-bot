import fs from "fs";
import path from "path";
import { server, rest } from "../test/server";
import { Probot } from "probot";

import appFn from "../src";

describe("My Probot app", () => {
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
    probot.load(appFn);
  });

  test("creates a comment when an issue is opened", async () => {
    const owner = "sttack";
    const repo = "watermelons";

    const mockCommentPostHandler = jest.fn().mockImplementation((req, res) => {
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
