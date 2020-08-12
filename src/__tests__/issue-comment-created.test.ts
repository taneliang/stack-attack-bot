import type { ResponseResolver } from "msw/lib/types";

import fs from "fs";
import path from "path";
import { Probot } from "probot";
import { cherryPickCommits } from "github-cherry-pick";

import { server, rest } from "../../test/server";
import { mockLogger } from "../logger/mockLogger";
import { event } from "../handlers/issue-comment-created";
import { makeAppFunction } from "../makeAppFunction";
import { commandAddressPrefix } from "../handlers/issue-comment-created/util/commandAddressPrefix";

jest.mock("github-cherry-pick");

const owner = "sttack";
const repo = "watermelons";
const issueNumber = 16;
const commentId = 2838293892;

const stackAttackDescription = `Stack PR by [STACK ATTACK](https://github.com/taneliang/stack-attack):
- #5 c1
- **#16 Fourth try**
- #9 This must work
- #6 WILL UPDATES WORK??????
- #7 THird try

Custom text
`;

function makePullRequestCommentPayload(
  comment: string,
  description: string,
  state: "open" | "closed" = "open"
) {
  return {
    id: "1234",
    name: "issue_comment",
    payload: {
      action: "created",
      issue: {
        id: 670684161,
        number: issueNumber,
        title: "Someone else comes along",
        user: {
          login: "24r",
        },
        state,
        pull_request: {},
        body: description,
        performed_via_github_app: null,
      },
      comment: {
        id: commentId,
        user: {
          login: "24r",
        },
        author_association: "OWNER", // TODO: Check what this is
        body: comment,
      },
      repository: {
        name: repo,
        owner: {
          login: owner,
        },
      },
    },
  };
}

function makeIssueCommentPayload(comment: string) {
  const prPayload = makePullRequestCommentPayload(
    comment,
    "Nolite te bastardes carborundorum."
  );
  delete prPayload.payload.issue.pull_request;
  return prPayload;
}

describe(event, () => {
  let probot: Probot;
  let mockCert: string;

  beforeAll((done) => {
    fs.readFile(
      path.join(__dirname, "../../test/fixtures/mock-cert.pem"),
      (err, cert) => {
        if (err) return done.fail(err);
        mockCert = cert.toString();
        done();
      }
    );
  });

  beforeEach(() => {
    probot = new Probot({ id: 123, cert: mockCert });
    probot.load(makeAppFunction(mockLogger()));
  });

  describe("ignoring", () => {
    it("should ignore comments on issues", async () => {
      const mockCommentPostHandler = jest.fn();
      server.use(
        rest.post(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
          mockCommentPostHandler
        )
      );
      await probot.receive(
        makeIssueCommentPayload(`${commandAddressPrefix}rebase`)
      );
      expect(mockCommentPostHandler).not.toHaveBeenCalled();
    });

    it("should ignore comments not addressed to us", async () => {
      const mockCommentPostHandler = jest.fn();
      server.use(
        rest.post(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
          mockCommentPostHandler
        )
      );
      await probot.receive(makePullRequestCommentPayload("hello", ""));
      expect(mockCommentPostHandler).not.toHaveBeenCalled();
    });

    it("should send help for comments addressed to us that do not have a valid command", async () => {
      const mockCommentPostHandler: ResponseResolver = jest.fn((req, res) => {
        expect(req.body).toMatchInlineSnapshot(`
          Object {
            "body": "HEY! Thanks for pinging [STACK ATTACK](https://github.com/taneliang/stack-attack)!

          I dare you – comment \`@StackAttack rebase\` and I'll rebase this stacked pull request! 🥞",
          }
        `);
        return res();
      });
      server.use(
        rest.post(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
          mockCommentPostHandler
        )
      );
      await probot.receive(
        makePullRequestCommentPayload(`${commandAddressPrefix}hello`, "")
      );
      expect(mockCommentPostHandler).toHaveBeenCalled();
    });
  });

  describe("land command", () => {
    it("should respond to land commands on Stack Attack PRs", async () => {
      const mockCommentPostHandler: ResponseResolver = jest.fn((req, res) => {
        expect(req.body).toMatchInlineSnapshot(`
                  Object {
                    "body": "Landing!

                  \`\`\`
                  | #16
                  ↓ #5
                  * base branch
                  \`\`\`",
                  }
              `);
        return res();
      });
      server.use(
        rest.post(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
          mockCommentPostHandler
        )
      );
      await probot.receive(
        makePullRequestCommentPayload(
          `${commandAddressPrefix}land`,
          stackAttackDescription
        )
      );
      expect(mockCommentPostHandler).toHaveBeenCalled();
    });

    it("should send help for land commands on non-Stack Attack PRs", async () => {
      const mockCommentPostHandler: ResponseResolver = jest.fn((req, res) => {
        expect(req.body).toMatchInlineSnapshot(`
                  Object {
                    "body": "Hey! Looks like this PR isn't managed by [Stack Attack](https://github.com/taneliang/stack-attack), so we can't do this for you.",
                  }
              `);
        return res();
      });
      server.use(
        rest.post(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
          mockCommentPostHandler
        )
      );
      await probot.receive(
        makePullRequestCommentPayload(`${commandAddressPrefix}land`, "NOT US")
      );
      expect(mockCommentPostHandler).toHaveBeenCalled();
    });
  });

  describe("rebase command", () => {
    it("should send help for rebase commands on closed PRs", async () => {
      const mockCommentPostHandler: ResponseResolver = jest.fn((req, res) => {
        expect(req.body).toMatchInlineSnapshot(`
                  Object {
                    "body": "Oops, we won't rebase closed PRs.",
                  }
              `);
        return res();
      });
      server.use(
        rest.post(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
          mockCommentPostHandler
        )
      );
      await probot.receive(
        makePullRequestCommentPayload(
          `${commandAddressPrefix}rebase`,
          stackAttackDescription,
          "closed"
        )
      );
      expect(mockCommentPostHandler).toHaveBeenCalled();
    });

    it("should send help for rebase commands on non-Stack Attack PRs", async () => {
      const mockCommentPostHandler: ResponseResolver = jest.fn((req, res) => {
        expect(req.body).toMatchInlineSnapshot(`
                  Object {
                    "body": "Hey! Looks like this PR isn't managed by [Stack Attack](https://github.com/taneliang/stack-attack), so we can't do this for you.",
                  }
              `);
        return res();
      });
      server.use(
        rest.post(
          `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
          mockCommentPostHandler
        )
      );
      await probot.receive(
        makePullRequestCommentPayload(`${commandAddressPrefix}rebase`, "NOT US")
      );
      expect(mockCommentPostHandler).toHaveBeenCalled();
    });

    it("should handle rebase commands addressed to us", async () => {
      const mockBaseRef = "MOCK_BASE_REF";
      const mockBaseSha = "MOCK_BASE_SHA";
      const mockHeadRef = "MOCK_HEAD_REF";
      const mockHeadSha = "MOCK_HEAD_SHA";
      const mockRebasedSha = "MOCK_REBASED_SHA";

      const mockCherryPickCommits = cherryPickCommits as jest.Mock;
      mockCherryPickCommits.mockResolvedValueOnce(mockRebasedSha);

      const mockReactionsCreateForIssueCommentHandler: ResponseResolver = jest.fn(
        (req, res) => {
          expect(req.body).toMatchInlineSnapshot(`
            Object {
              "content": "+1",
            }
          `);
          return res();
        }
      );
      const mockUpdateRefHandler: ResponseResolver = jest.fn((req, res) => {
        expect(req.body).toMatchInlineSnapshot(`
          Object {
            "force": true,
            "sha": "MOCK_REBASED_SHA",
          }
        `);
        return res();
      });
      server.use(
        rest.post(
          `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}/reactions`,
          mockReactionsCreateForIssueCommentHandler
        ),
        rest.post(
          `https://api.github.com/repos/${owner}/${repo}/git/refs`,
          (_req, res) => {
            // TODO: Test that created temp ref is also deleted
            return res();
          }
        ),
        rest.delete(
          `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/*`,
          (_req, res) => {
            return res();
          }
        ),
        rest.get(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${issueNumber}`,
          (_req, res, ctx) => {
            return res(
              ctx.json({
                base: { ref: mockBaseRef },
                head: { ref: mockHeadRef, sha: mockHeadSha },
              })
            );
          }
        ),
        rest.get(
          `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${mockBaseRef}`,
          (_req, res, ctx) => {
            return res(
              ctx.json({
                object: { sha: mockBaseSha },
              })
            );
          }
        ),
        rest.patch(
          `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${mockHeadRef}`,
          mockUpdateRefHandler
        )
      );
      await probot.receive(
        makePullRequestCommentPayload(
          `${commandAddressPrefix}rebase`,
          stackAttackDescription
        )
      );

      expect(mockReactionsCreateForIssueCommentHandler).toHaveBeenCalled();
      expect(mockUpdateRefHandler).toHaveBeenCalled();

      // Only rebase once!
      expect(mockCherryPickCommits).toHaveBeenCalledTimes(1);

      // Sanity check to ensure we only passed 1 argument to cherryPickCommits;
      // this check ensures that all arguments are tested in this test.
      expect(mockCherryPickCommits.mock.calls[0]).toHaveLength(1);

      // Expect correct parameters
      const parameterObject = mockCherryPickCommits.mock.calls[0][0];
      expect(parameterObject).toHaveProperty("octokit");
      expect(parameterObject.owner).toBe(owner);
      expect(parameterObject.repo).toBe(repo);
      expect(parameterObject.commits).toEqual([mockHeadSha]);
      // TODO: Expect cherry pick head uses temp branch
    });
  });
});
