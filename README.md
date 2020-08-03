# github-webhook

A minimal GitHub webhook listener that executes a specified command when a release is published.

## Installation

```bash
git clone ...
cd github-webhook
npm install --production
pm2 start ecosystem.config.json
```

## Configuration

Edit an `.env` file in the project directory with the following options:

```ini
# GitHub Webhook Secret
SECRET=ABC123

# Script to execute when a release is published
SCRIPT=/usr/bin/local/update.sh

# Port to run the server on
PORT=32490
```

## License

MIT © Jesse Youngblood
