# github-webhook

A minimal GitHub webhook listener that executes a script when a push event occurs on the default branch, or when a release is published.

[![ci](https://github.com/jessety/github-webhook/workflows/ci/badge.svg)](https://github.com/jessety/github-webhook/actions)

## Installation

```bash
git clone ...
cd github-webhook

npm install --production
pm2 start ecosystem.config.json
```

## Configuration

Populate an `.env` file in the project directory with the following options:

```ini
# GitHub Webhook Secret (required)
SECRET=ABC123

# Script to execute when a release is published
SCRIPT_RELEASE=/usr/local/bin/release.sh

# Script to execute when there is a push to the default branch
SCRIPT_PUSH=/usr/local/bin/push.sh

# Name of the default branch, if it isn't "main" or "master"
DEFAULT_BRANCH=primary

# Port to run the server on
PORT=32490
```

## Scripts

Scripts are executed with the name of the repository as the first parameter, and the event type as the second.

Push events are only triggered when a push is made to the default branch. The script is executed with the name of that branch as its third parameter. Given the above configuration, the following will be executed a push is made to the `primary` branch:

```bash
/usr/local/bin/push.sh jessety/github-webhook push primary
```

When a release is triggered, the release tag is sent as a third parameter:

```bash
/usr/local/bin/release.sh jessety/github-webhook release v1.1.4
```

## License

MIT © Jesse Youngblood
