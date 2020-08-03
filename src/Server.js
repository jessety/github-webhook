'use strict';

const fs = require('fs');
const http = require('http');
const https = require('https');
const constants = require('constants');
const EventEmitter = require('events');
const ModernError = require('modern-error');

class ServerError extends ModernError {}
class ConfigurationError extends ModernError {}

class Server extends EventEmitter {

  constructor(options = {}, requestListener) {

    super();

    if (typeof options.port !== 'number') {

      options.port = 32490;
    }

    if (typeof options.https === 'object') {

      // Delete any blank values

      for (const key of ['key', 'cert', 'keyPath', 'certPath', 'secureProtocol', 'secureOptions', 'ciphers']) {

        if (options.https[key] === '') {
          delete options.https[key];
        }
      }
    }

    this.options = options;

    this.requestListener = requestListener;
  }

  /**
   * Start http / https server
   * @public
   * @returns {Promise}
   */
  listen() {

    return new Promise((resolve, reject) => {

      const { options, requestListener } = this;
      const { port } = options;

      // If SSL is enabled, start an https server

      let httpsOptions;

      try {
        httpsOptions = this.loadHTTPSOptions();
      } catch (error) {
        reject(error);
        return;
      }

      if (typeof httpsOptions === 'object') {

        try {

          this.server = https.createServer(httpsOptions, requestListener);

          this.server.on('error', error => this.emit('error', new ServerError(error)));

          this.server.listen(port, () => {
            this.emit('listening', { type: 'https', port });
            resolve(this.server);
          });

        } catch (error) {

          reject(error);
        }

        return;
      }

      // If ssl isn't enabled, start an http server

      this.server = http.createServer(requestListener);

      this.server.on('error', error => this.emit('error', new ServerError(error)));

      this.server.listen(port, () => {
        this.emit('listening', { type: 'http', port });
        resolve(this.server);
      });
    });
  }

  /**
   * Stop http / https server
   * @public
   * @returns {Promise}
   */
  close() {

    return new Promise((resolve, reject) => {

      if (this.server === undefined || this.server.listening === false) {
        resolve();
        return;
      }

      this.server.close(error => {

        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Load SSL key and cert
   * @private
   * @throws {Error} Throws an error if SSL is enabled, but the cert/key aren't loadable
   * @returns {object} HTTPS config
   */
  loadHTTPSOptions() {

    const { https: options } = this.options;

    if (typeof options !== 'object') {
      return;
    }

    if (options.key === undefined && options.keyPath === undefined) {
      throw new ConfigurationError(`HTTPS key not specified. To use HTTPS, please include either "https.key" or "https.keyPath".`);
    }

    if (options.cert === undefined && options.certPath === undefined) {
      throw new ConfigurationError(`HTTPS certificate not specified. To use HTTPS, please include either "https.cert" or "https.certPath".`);
    }

    // If we have a path for the cert / load them

    if (options.key === undefined) {
      try {
        options.key = fs.readFileSync(options.keyPath);
      } catch (error) {
        throw new ConfigurationError(`SSL key could not be read at "${options.keyPath}".`);
      }
    }

    if (options.cert === undefined) {
      try {
        options.cert = fs.readFileSync(options.certPath);
      } catch (error) {
        throw new ConfigurationError(`SSL certificate could not be read at "${options.certPath}".`);
      }
    }

    if (options.secureProtocol === undefined) {
      options.secureProtocol = 'SSLv23_method';
    }

    if (options.secureOptions === undefined) {
      options.secureOptions = constants.SSL_OP_NO_SSLv3;
    }

    if (options.ciphers === undefined) {

      options.ciphers = [
        'ECDHE-RSA-AES256-SHA384',
        'DHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES256-SHA256',
        'DHE-RSA-AES256-SHA256',
        'ECDHE-RSA-AES128-SHA256',
        'DHE-RSA-AES128-SHA256',
        'HIGH',
        '!aNULL',
        '!eNULL',
        '!EXPORT',
        '!DES',
        '!RC4',
        '!MD5',
        '!PSK',
        '!SRP',
        '!CAMELLIA'
      ].join(':');

      if (typeof options.honorCipherOrder !== 'boolean') {
        options.honorCipherOrder = true;
      }
    }

    return options;
  }
}

module.exports = Server;
