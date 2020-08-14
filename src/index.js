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

// If verbose mode is enabled, log out every event

if (options.verbose === true) {

  console.log(`Verbose mode enabled, logging all incoming events.`);

  webhook.onAny((event, payload) => {

    const { repository, action } = payload;
    console.log(`${new Date().toLocaleString()} - ${repository.full_name}: ${event} ${action ? `${action}` : ''}`);
  });
}

// When a release is published, execute the 'release' script

webhook.on('release', payload => {

  const { repository, action, release } = payload;

  if (action !== 'published') {
    return;
  }

  console.log(`\n\n${new Date().toLocaleString()} - ${repository.full_name} ${release.tag_name} ${action}`);

  if (options.script_release === '') {
    return;
  }

  execute(options.script_release, repository.full_name, 'release', release.tag_name);
});

// When a push event occurs on the default branch, execute the 'push' script

webhook.on('push', payload => {

  const branch = payload.ref.replace('refs/heads/', '');

  const defaultBranchNames = ['main', 'master'];

  if (options.default_branch !== '' && defaultBranchNames.includes(options.default_branch) === false) {
    defaultBranchNames.push(options.default_branch);
  }

  if (defaultBranchNames.includes(branch) === false) {
    return;
  }

  const { repository } = payload;

  console.log(`\n\n${new Date().toLocaleString()} - ${repository.full_name} push ${branch}`);

  if (options.script_push === '') {
    return;
  }

  execute(options.script_push, repository.full_name, 'push', branch);
});

// Start listening for incoming events

webhook.listen().then(() => {

  console.log(`${name} ${version} live on port ${options.port}`);
});
