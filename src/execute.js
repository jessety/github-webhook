'use strict';

const util = require('util');
const child_process = require('child_process');
const exec = util.promisify(child_process.exec);

/**
 * Execute a command
 * @param {string} command - command to execute
 * @param  {...string} arguments - arguments
 */
module.exports = async function execute(command, ...args) {

  const line = `${command} ${args.join(' ')}`;

  console.log(`Executing: ${line}`);

  try {

    const { stdout, stderr } = await exec(line, { shell: true });

    if (stderr.trim() !== '') {
      console.error(stderr);
    }

    if (stdout.trim() !== '') {
      console.log(stdout);
    }

  } catch (error) {

    console.error(error);
  }
};
