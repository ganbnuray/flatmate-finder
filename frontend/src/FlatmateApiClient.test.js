import FlatmateApiClient from './FlatmateApiClient';

describe('FlatmateApiClient', () => {
  let client;

  beforeEach(() => {
    client = new FlatmateApiClient();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockFetchResponse({ ok = true, status = 200, jsonBody = {}, shouldThrow = false }) {
    if (shouldThrow) {
      global.fetch.mockRejectedValueOnce(new Error('network down'));
      return;
    }
    global.fetch.mockResolvedValueOnce({
      ok,
      status,
      json: jest.fn().mockResolvedValue(jsonBody),
    });
  }

  describe('request()', () => {
    test('sends Content-Type and Accept json headers', async () => {
      mockFetchResponse({});
      await client.get('/foo');
      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers).toEqual({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });
    });

    test('sends credentials include for session cookies', async () => {
      mockFetchResponse({});
      await client.get('/foo');
      const [, options] = global.fetch.mock.calls[0];
      expect(options.credentials).toBe('include');
    });

    test('stringifies the body when provided', async () => {
      mockFetchResponse({});
      await client.post('/foo', { a: 1 });
      const [, options] = global.fetch.mock.calls[0];
      expect(options.body).toBe('{"a":1}');
    });

    test('sends null body when no body provided', async () => {
      mockFetchResponse({});
      await client.get('/foo');
      const [, options] = global.fetch.mock.calls[0];
      expect(options.body).toBeNull();
    });

    test('returns ok true and parsed body on success', async () => {
      mockFetchResponse({ ok: true, status: 200, jsonBody: { hello: 'world' } });
      const result = await client.get('/foo');
      expect(result).toEqual({ ok: true, status: 200, body: { hello: 'world' } });
    });

    test('returns ok false and parsed body on error status', async () => {
      mockFetchResponse({ ok: false, status: 400, jsonBody: { error: 'bad' } });
      const result = await client.get('/foo');
      expect(result).toEqual({ ok: false, status: 400, body: { error: 'bad' } });
    });

    test('returns body null for 204 No Content', async () => {
      const jsonSpy = jest.fn().mockResolvedValue({});
      global.fetch.mockResolvedValueOnce({ ok: true, status: 204, json: jsonSpy });
      const result = await client.delete('/foo');
      expect(jsonSpy).not.toHaveBeenCalled();
      expect(result.body).toBeNull();
      expect(result.status).toBe(204);
    });

    test('returns body null when json parse fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('not json')),
      });
      const result = await client.get('/foo');
      expect(result).toEqual({ ok: true, status: 200, body: null });
    });

    test('returns network error envelope when fetch throws', async () => {
      mockFetchResponse({ shouldThrow: true });
      const result = await client.get('/foo');
      expect(result).toEqual({ ok: false, status: 0, body: { error: 'Network error' } });
    });
  });

  describe('HTTP verb methods', () => {
    test('get() calls fetch with GET method and given url', async () => {
      mockFetchResponse({});
      await client.get('/foo');
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/foo');
      expect(options.method).toBe('GET');
    });

    test('post() calls fetch with POST method, url, and body', async () => {
      mockFetchResponse({});
      await client.post('/foo', { x: 1 });
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/foo');
      expect(options.method).toBe('POST');
      expect(options.body).toBe(JSON.stringify({ x: 1 }));
    });

    test('put() calls fetch with PUT method, url, and body', async () => {
      mockFetchResponse({});
      await client.put('/foo', { x: 1 });
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/foo');
      expect(options.method).toBe('PUT');
      expect(options.body).toBe(JSON.stringify({ x: 1 }));
    });

    test('delete() calls fetch with DELETE method and url', async () => {
      mockFetchResponse({});
      await client.delete('/foo');
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/foo');
      expect(options.method).toBe('DELETE');
      expect(options.body).toBeNull();
    });
  });

  describe('domain methods', () => {
    test('login() POSTs to /auth/login with email and password body', async () => {
      mockFetchResponse({});
      await client.login('a@b.com', 'pass1234');
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/auth/login');
      expect(options.method).toBe('POST');
      expect(options.body).toBe(JSON.stringify({ email: 'a@b.com', password: 'pass1234' }));
    });

    test('register() POSTs to /auth/register with email and password body', async () => {
      mockFetchResponse({});
      await client.register('a@b.com', 'pass1234');
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/auth/register');
      expect(options.method).toBe('POST');
      expect(options.body).toBe(JSON.stringify({ email: 'a@b.com', password: 'pass1234' }));
    });

    test('logout() DELETEs /auth/logout', async () => {
      mockFetchResponse({ status: 204 });
      await client.logout();
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/auth/logout');
      expect(options.method).toBe('DELETE');
    });

    test('getCurrentUser() GETs /profiles/me', async () => {
      mockFetchResponse({});
      await client.getCurrentUser();
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/profiles/me');
      expect(options.method).toBe('GET');
    });

    test('getProfiles() GETs /profiles', async () => {
      mockFetchResponse({});
      await client.getProfiles();
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/profiles');
      expect(options.method).toBe('GET');
    });

    test('likeProfile(userId) POSTs to /profiles/{userId}/like with interpolated URL', async () => {
      mockFetchResponse({});
      await client.likeProfile('abc-123');
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/profiles/abc-123/like');
      expect(options.method).toBe('POST');
      // post(url) defaults body to {} which is truthy, so {} gets stringified
      expect(options.body).toBe('{}');
    });

    test('passProfile(userId) POSTs to /profiles/{userId}/pass with interpolated URL', async () => {
      mockFetchResponse({});
      await client.passProfile('abc-123');
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/profiles/abc-123/pass');
      expect(options.method).toBe('POST');
      expect(options.body).toBe('{}');
    });

    test('getMatches() GETs /matches', async () => {
      mockFetchResponse({});
      await client.getMatches();
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/matches');
      expect(options.method).toBe('GET');
    });

    test('getMessages(matchId) GETs /matches/{matchId}/messages', async () => {
      mockFetchResponse({});
      await client.getMessages('m-1');
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/matches/m-1/messages');
      expect(options.method).toBe('GET');
    });

    test('sendMessage(matchId, text) POSTs to /matches/{matchId}/messages with body field set to the text', async () => {
      // The wire field name is "body", not "text" — this is the intended API contract
      mockFetchResponse({});
      await client.sendMessage('m-1', 'hello');
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/matches/m-1/messages');
      expect(options.method).toBe('POST');
      expect(options.body).toBe(JSON.stringify({ body: 'hello' }));
    });

    test('updateProfile(data) PUTs /profiles/me with the data as body', async () => {
      mockFetchResponse({});
      await client.updateProfile({ name: 'Alice' });
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/profiles/me');
      expect(options.method).toBe('PUT');
      expect(options.body).toBe(JSON.stringify({ name: 'Alice' }));
    });

    test('blockUser(userId) POSTs to /profiles/{userId}/block', async () => {
      mockFetchResponse({});
      await client.blockUser('u-1');
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/profiles/u-1/block');
      expect(options.method).toBe('POST');
      expect(options.body).toBe('{}');
    });

    test('reportUser(userId, reason, details) POSTs to /profiles/{userId}/report with reason and details', async () => {
      mockFetchResponse({});
      await client.reportUser('u-1', 'spam', 'repeated harassment');
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/profiles/u-1/report');
      expect(options.method).toBe('POST');
      expect(options.body).toBe(JSON.stringify({ reason: 'spam', details: 'repeated harassment' }));
    });

    test('reportUser(userId, reason) defaults details to empty string when not provided', async () => {
      mockFetchResponse({});
      await client.reportUser('u-1', 'spam');
      const [, options] = global.fetch.mock.calls[0];
      expect(options.body).toBe(JSON.stringify({ reason: 'spam', details: '' }));
    });
  });
});
