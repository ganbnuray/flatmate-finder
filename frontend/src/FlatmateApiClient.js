/**
 * @fileoverview API client for Flatmate Finder.
 *
 * All fetch() calls in the application must go through this class. No page,
 * component, or context may call fetch() directly.
 *
 * The base URL is read from REACT_APP_API_URL; it falls back to an empty
 * string so that the CRA dev proxy (setupProxy.js) handles routing in
 * development. Domain methods delegate to base HTTP verb methods which
 * delegate to request() — only request() touches the network.
 */

export default class FlatmateApiClient {
  /**
   * Sends an HTTP request and returns a normalised response envelope.
   *
   * @param {Object} options - Request options.
   * @param {string} options.method - HTTP method ('GET', 'POST', 'PUT', 'DELETE').
   * @param {string} options.url - API path (e.g. '/auth/login').
   * @param {Object} [options.body] - Request body for POST/PUT.
   * @param {Object} [options.query] - Query parameters for GET.
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async request(options) {
    try {
      const response = await fetch(options.url, {
        method: options.method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: options.body ? JSON.stringify(options.body) : null,
      });
      let body = null;
      if (response.status !== 204) {
        try {
          body = await response.json();
        } catch {
          body = null;
        }
      }
      return { ok: response.ok, status: response.status, body };
    } catch {
      return { ok: false, status: 0, body: { error: 'Network error' } };
    }
  }

  /**
   * Makes a GET request.
   *
   * @param {string} url - API path.
   * @param {Object} [query={}] - Query parameters.
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async get(url, query = {}) {
    return this.request({ method: 'GET', url, query });
  }

  /**
   * Makes a POST request.
   *
   * @param {string} url - API path.
   * @param {Object} [body={}] - Request body.
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async post(url, body = {}) {
    return this.request({ method: 'POST', url, body });
  }

  /**
   * Makes a PUT request.
   *
   * @param {string} url - API path.
   * @param {Object} [body={}] - Request body.
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async put(url, body = {}) {
    return this.request({ method: 'PUT', url, body });
  }

  /**
   * Makes a DELETE request.
   *
   * @param {string} url - API path.
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async delete(url) {
    return this.request({ method: 'DELETE', url });
  }

  /**
   * Logs in a user with email and password.
   *
   * @param {string} email - User's email address.
   * @param {string} password - User's password.
   * @returns {Promise<{ok: boolean, status: number, body: {user: Object}|null}>}
   */
  async login(email, password) {
    return this.post('/auth/login', { email, password });
  }

  /**
   * Registers a new user account.
   *
   * The returned user has is_complete set to false, triggering onboarding.
   *
   * @param {string} email - User's email address.
   * @param {string} password - User's chosen password.
   * @returns {Promise<{ok: boolean, status: number, body: {user: Object}|null}>}
   */
  async register(email, password) {
    return this.post('/auth/register', { email, password });
  }

  /**
   * Logs out the current user and invalidates the session.
   *
   * @returns {Promise<{ok: boolean, status: number, body: null}>}
   */
  async logout() {
    return this.delete('/auth/logout');
  }

  /**
   * Fetches the current authenticated user's profile.
   *
   * @returns {Promise<{ok: boolean, status: number, body: {user: Object}|null}>}
   */
  async getCurrentUser() {
    return this.get('/profiles/me');
  }

  /**
   * Fetches the discovery feed — profiles the current user has not yet
   * liked or passed.
   *
   * @returns {Promise<{ok: boolean, status: number, body: {profiles: Object[]}|null}>}
   */
  async getProfiles() {
    return this.get('/profiles');
  }

  /**
   * Records a LIKE action on the target user profile.
   *
   * If the target has already liked the current user, a match is created
   * and the response includes matched: true and the new match object.
   *
   * @param {string} userId - The user_id of the profile to like.
   * @returns {Promise<{ok: boolean, status: number, body: {matched: boolean, match: Object|null}}>}
   */
  async likeProfile(userId) {
    return this.post(`/profiles/${userId}/like`);
  }

  /**
   * Records a PASS action on the target user profile.
   *
   * @param {string} userId - The user_id of the profile to pass.
   * @returns {Promise<{ok: boolean, status: number, body: {passed: boolean}}>}
   */
  async passProfile(userId) {
    return this.post(`/profiles/${userId}/pass`);
  }

  /**
   * Fetches all active matches for the current user.
   *
   * @returns {Promise<{ok: boolean, status: number, body: {matches: Object[]}|null}>}
   */
  async getMatches() {
    return this.get('/matches');
  }

  /**
   * Fetches the message history for a given match.
   *
   * @param {string} matchId - The match_id to retrieve messages for.
   * @returns {Promise<{ok: boolean, status: number, body: {messages: Object[]}|null}>}
   */
  async getMessages(matchId) {
    return this.get(`/matches/${matchId}/messages`);
  }

  /**
   * Sends a text message in a match conversation.
   *
   * @param {string} matchId - The match_id to send the message to.
   * @param {string} text - The message body text.
   * @returns {Promise<{ok: boolean, status: number, body: {message: Object}|null}>}
   */
  async sendMessage(matchId, text) {
    return this.post(`/matches/${matchId}/messages`, { body: text });
  }

  /**
   * Updates the current user's profile fields.
   *
   * Accepts a partial update — only supplied fields are merged.
   *
   * @param {Object} profileData - Profile fields to update (schema-aligned).
   * @returns {Promise<{ok: boolean, status: number, body: {user: Object}|null}>}
   */
  async updateProfile(profileData) {
    return this.put('/profiles/me', profileData);
  }

  /**
   * Blocks a user, hiding them from discovery and matches.
   *
   * @param {string} userId - The user_id of the profile to block.
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async blockUser(userId) {
    return this.post(`/profiles/${userId}/block`);
  }

  /**
   * Reports a user for a specific reason.
   *
   * @param {string} userId - The user_id of the profile to report.
   * @param {string} reason - The enum reason for reporting.
   * @param {string} [details] - Optional text details.
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async reportUser(userId, reason, details = '') {
    return this.post(`/profiles/${userId}/report`, { reason, details });
  }
}
