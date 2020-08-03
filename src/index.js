'use strict';

const WebHook = require('./WebHook.js');
const execute = require('./execute.js');
const { name, version } = require('../package.json');

// Load options

const options = require('env-smart').load({ lowercase: true, replace: false });

// Instantiate the class

const webhook = new WebHook(options);

// Print errors

webhook.on('error', error => console.error(error));

// If verbose mode is enabled, print out every event we receive

if (options.verbose === true) {

  webhook.onAny((event, payload) => {

    const { repository, action } = payload;
    console.log(`${new Date().toLocaleString()} - ${repository.full_name}: ${event} ${action ? `${action}` : ''}`);
  });
}

// When a release is published, execute the update script

webhook.on('release', payload => {

  const { repository, action, release } = payload;

  if (action !== 'published') {
    return;
  }

  console.log(`\n\n${new Date().toLocaleString()} - ${repository.full_name} ${release.tag_name} ${action}`);

  execute(options.script, repository.full_name);
});

// Listen for incoming events

webhook.listen().then(() => {

  console.log(`${name} ${version} live on port ${options.port}`);
});
