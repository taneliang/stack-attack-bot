# Stack Attack Bot

[![CircleCI](https://circleci.com/gh/taneliang/stack-attack-bot.svg?style=svg)](https://circleci.com/gh/taneliang/stack-attack-bot)
[![codecov](https://codecov.io/gh/taneliang/stack-attack-bot/branch/main/graph/badge.svg)](https://codecov.io/gh/taneliang/stack-attack-bot)
[![Maintainability](https://api.codeclimate.com/v1/badges/a0dbe6e2f701783fd88a/maintainability)](https://codeclimate.com/github/taneliang/stack-attack-bot/maintainability)

A GitHub App built with [Probot](https://github.com/probot/probot) that
rebases and lands [Stack Attack](https://github.com/taneliang/stack-attack)
PRs on GitHub.

## Usage (envisioned)

Comment on PRs to trigger bot actions.

### Rebasing (i.e. updating) PRs

- Rebasing a PR onto its base branch: `@sttack rebase`
- Rebasing a PR onto another branch: `@sttack rebase <branch name>`
- Restacking a stack of PRs: `@sttack rebase-stack` or `@sttack restack`

### Landing PRs

To land a stack, command `@sttack land` on the last PR of the stack that you
want to land. For example:

```
↓ #3
↓ #2 ← If you comment `@sttack land` here,
↓ #1 ← this PR will also be landed because #2 depends on it
* base branch (e.g. master, main)
```

## Setup

```sh
# Install dependencies
yarn

# Run with hot reload
yarn build:watch

# Compile and run
yarn build
yarn start
```

## Contributing

If you have suggestions for how stack-attack-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2020 E-Liang Tan <eliang@eliangtan.com>
