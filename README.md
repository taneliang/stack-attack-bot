# Stack Attack Bot

[![CircleCI](https://circleci.com/gh/StackAttack/stack-attack-bot.svg?style=svg)](https://circleci.com/gh/StackAttack/stack-attack-bot)
[![codecov](https://codecov.io/gh/StackAttack/stack-attack-bot/branch/main/graph/badge.svg)](https://codecov.io/gh/StackAttack/stack-attack-bot)
[![Maintainability](https://api.codeclimate.com/v1/badges/80de0bbdf29f45ed1e6b/maintainability)](https://codeclimate.com/github/StackAttack/stack-attack-bot/maintainability)

A GitHub App built with [Probot](https://github.com/probot/probot) that
rebases and lands [Stack Attack](https://github.com/taneliang/stack-attack)
PRs on GitHub.

## Usage

Comment on PRs to trigger bot actions.

### Rebasing (i.e. updating) PRs

When a base branch for a stacked pull request has been updated, Stack Attack
can help you to rebase it to resolve merge conflicts and prepare it for
merging.

Simply comment `@StackAttack rebase` on the PR to rebase the PR!

### Landing PRs (TODO)

To land a stack, command `@StackAttack land` on the last PR of the stack that you
want to land. For example:

```
↓ #3
↓ #2 ← If you comment `@StackAttack land` here,
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
