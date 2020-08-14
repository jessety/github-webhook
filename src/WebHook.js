'use strict';

const crypto = require('crypto');
const EventEmitter2 = require('eventemitter2');
const ModernError = require('modern-error');
class AuthError extends ModernError {}

const Server = require('./Server.js');

class GitHubWebhook extends EventEmitter2 {

  /**
   *
   * @param {object} options
   * @param {number} options.port
   * @param {string} options.secret
   */
  constructor(options = {}) {
    super();

    if (typeof options.port !== 'number') {
      throw new Error('GitHub WebHook requires a port to run on');
    }

    if (typeof options.secret !== 'string' || options.secret === '') {
      throw new Error('GitHub WebHook requires a "secret"');
    }

    this.options = options;
  }

  /**
   * Listen for incoming requests
   * @public
   */
  async listen() {
    return this.server.listen();
  }

  /**
   * Stop listening for incoming requests
   * @public
   */
  async close() {
    return this.server.close();
  }

  /**
   * Return a HTTP/s server
   * @private
   */
  get server() {

    if (this._server !== undefined) {
      return this._server;
    }

    this._server = new Server(this.options, (...args) => this.handleRequest(...args));
    this._server.on('error', error => this.emit('error', error));

    return this._server;
  }

  /**
   * Handle incoming requests
   * @private
   */
  handleRequest(request, response) {

    const chunks = [];

    request.on('data', chunk => chunks.push(chunk));

    request.on('end', () => {

      request.rawBody = Buffer.concat(chunks).toString();

      if (request.headers['x-hub-signature'] === undefined) {
        response.writeHead(401);
        response.end('Authentication failed.');
        return;
      }

      const signature = crypto.createHmac('sha1', this.options.secret).update(request.rawBody).digest('hex');

      if (`sha1=${signature}` !== request.headers['x-hub-signature']) {

        const error = new AuthError(`Request rejected, signature does not match.`, {
          expected: `sha1=${signature}`,
          received: request.headers['x-hub-signature'],
          stack: undefined
        });

        this.emit('error', error);

        response.writeHead(401);
        response.end('Authentication failed, signature did not match.');
        return;
      }

      try {

        request.body = JSON.parse(request.rawBody);

      } catch (error) {

        response.writeHead(400);
        response.end('Could not parse body as JSON.');
        return;
      }

      response.writeHead(200);
      response.end('ok');

      const event = request.headers['x-github-event'];

      this.emit(event, request.body);
    });
  }
}


module.exports = GitHubWebhook;
