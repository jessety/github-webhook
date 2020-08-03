'use strict';

const fetch = require('node-fetch');

const WebHook = require('../src/WebHook.js');

describe('WebHook class', () => {

  test('throws exception when created without required parameters', () => {

    expect(() => new WebHook()).toThrow();
    expect(() => new WebHook({ port: 123 })).toThrow();
    expect(() => new WebHook({ secret: 'SECRET' })).toThrow();
    expect(() => new WebHook({ port: 123, secret: 'SECRET' })).not.toThrow();
  });

  test('rejects requests without signatures', async () => {

    const port = 32490;
    const secret = 'SECRET';

    const webhook = new WebHook({ port, secret });

    await webhook.listen();

    const response = await fetch(`http://localhost:${port}/`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: '{"action":"test"}'
    });

    expect(response.status).toBe(401);

    await webhook.close();
  });

  test('rejects invalid signatures', async () => {

    expect.assertions(2);

    const port = 32491;
    const secret = '_TEST_SECRET_';

    const webhook = new WebHook({ port, secret });

    webhook.on('error', error => {
      expect(error).not.toBeUndefined();
    });

    await webhook.listen();

    const invalid = await fetch(`http://localhost:${port}/`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'test',
        'x-hub-signature': 'sha1=ffff0cad6afcdfa12823903eb2bd8536b14e96c0'
      },
      body: '{"action":"test"}'
    });

    expect(invalid.status).toBe(401);

    await webhook.close();
  });

  test('accepts valid signatures', async () => {

    expect.assertions(2);

    const port = 32492;
    const secret = '_TEST_SECRET_';

    const webhook = new WebHook({ port, secret });

    webhook.on('test', (payload) => {
      expect(payload.action).toBe('test');
    });

    await webhook.listen();

    const response = await fetch(`http://localhost:${port}/`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'test',
        'x-hub-signature': 'sha1=a8b40cad6afcdfa12823903eb2bd8536b14e96c0'
      },
      body: '{"action":"test"}'
    });

    expect(response.status).toBe(200);

    await webhook.close();
  });

  test('rejects invalid JSON payloads', async () => {

    const port = 32493;
    const secret = '_TEST_SECRET_';

    const webhook = new WebHook({ port, secret });

    await webhook.listen();

    const response = await fetch(`http://localhost:${port}/`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'ping',
        'x-hub-signature': 'sha1=8e8159a2a56228f1f997e23824292c24c0eb4661'
      },
      body: '{"action":"test'
    });

    expect(response.status).toBe(400);

    await webhook.close();
  });
});
