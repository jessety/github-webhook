'use strict';

const Server = require('../src/Server.js');
const fetch = require('node-fetch');

jest.setTimeout(3 * 1000);

describe('HTTP server', () => {

  test('sets correct defaults', () => {

    const server = new Server();

    expect(server.options.port).toBe(32490);
    expect(server.https).toBeUndefined();
  });

  test('ignores empty keys and certs', () => {

    const server = new Server({
      https: {
        key: '',
        cert: '',
        keyPath: '',
        certPath: ''
      }
    });

    expect(server.options.https.key).toBeUndefined();
    expect(server.options.https.cert).toBeUndefined();

    expect(server.options.https.keyPath).toBeUndefined();
    expect(server.options.https.certPath).toBeUndefined();
  });

  test('rejects https with missing cert', async () => {

    expect.assertions(1);

    const server = new Server({
      https: { key: 'abc123' }
    });

    try {
      await server.listen();
    } catch (error) {
      expect(error.name).toBe('ConfigurationError');
    }
  });

  test('rejects https with missing key', async () => {

    expect.assertions(1);

    const server = new Server({
      https: { cert: 'abc123' }
    });

    try {
      await server.listen();
    } catch (error) {
      expect(error.name).toBe('ConfigurationError');
    }
  });

  test('handles incoming requests', async (done) => {

    const port = 32480;

    const server = new Server({ port }, (request, response) => {
      response.writeHead(200);
      response.end('ok');
    });

    await server.listen();

    const response = await fetch(`http://localhost:${port}/test`);

    expect(response.status).toBe(200);

    const text = await response.text();

    expect(text).toBe('ok');

    await server.close();

    done();
  });
});
