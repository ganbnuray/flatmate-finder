/**
 * @fileoverview API client for Flatmate Finder.
 *
 * All fetch() calls in the application must go through this class. No page,
 * component, or context may call fetch() directly.
 *
 * Currently in DUMMY MODE: request() simulates server responses using
 * hardcoded data. When the Flask backend is ready, replace the body of
 * request() with a real fetch() call. Domain methods (login, getProfiles,
 * etc.) and base HTTP methods (get, post, put, delete) do not need to change.
 *
 * Real backend implementation of request() will be:
 *   const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
 *   const response = await fetch(BASE_URL + options.url, {
 *     method: options.method,
 *     headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
 *     credentials: 'include',   // Flask-Login session cookies
 *     body: options.body ? JSON.stringify(options.body) : null,
 *   });
 *   return {
 *     ok: response.ok,
 *     status: response.status,
 *     body: response.status !== 204 ? await response.json() : null,
 *   };
 *
 * All field names and enum values in dummy data match db/schema.sql exactly
 * so the backend swap is seamless.
 */

// ─── Schema enum values ────────────────────────────────────────────────────
// cleanliness_level: 'very_clean' | 'clean' | 'moderate' | 'relaxed'
// smoking_pref:      'non_smoker' | 'outside_only' | 'smoker' | 'no_preference'
// pets_pref:         'no_pets' | 'has_pets' | 'ok_with_pets' | 'no_preference'
// sleep_schedule:    'early_bird' | 'night_owl' | 'flexible'
// housing_status:    'HAS_APARTMENT' | 'LOOKING' | 'EITHER'
// guests_pref:       'rarely' | 'sometimes' | 'often' | 'no_preference'
// noise_level:       'quiet' | 'moderate' | 'lively'

// ─── Module-level dummy data ───────────────────────────────────────────────

const CURRENT_USER = {
  user_id: 'u-001',
  email: 'alex@example.com',
  display_name: 'Alex Chen',
  age: 24,
  city: 'London',
  housing_status: 'LOOKING',
  budget_min: 900,
  budget_max: 1400,
  cleanliness: 'clean',
  smoking: 'non_smoker',
  pets: 'no_pets',
  sleep_schedule: 'flexible',
  guests: 'sometimes',
  noise_level: 'moderate',
  bio: 'Software engineering student. Clean, quiet, reliable. Looking for a similar flatmate in zone 2-3.',
  is_complete: true,
  initials: 'AC',
  accent_color: '#f59e0b',
};

const BROWSE_PROFILES = [
  {
    user_id: 'u-002',
    display_name: 'Priya Sharma',
    age: 23,
    city: 'London',
    housing_status: 'LOOKING',
    budget_min: 800,
    budget_max: 1200,
    cleanliness: 'clean',
    smoking: 'non_smoker',
    pets: 'ok_with_pets',
    sleep_schedule: 'night_owl',
    guests: 'sometimes',
    noise_level: 'moderate',
    bio: 'PhD student in neuroscience. Love cooking elaborate meals on weekends. Looking for someone tidy and respectful of study hours.',
    is_complete: true,
    initials: 'PS',
    accent_color: '#6366f1',
  },
  {
    user_id: 'u-003',
    display_name: 'James Okonkwo',
    age: 25,
    city: 'London',
    housing_status: 'LOOKING',
    budget_min: 1000,
    budget_max: 1500,
    cleanliness: 'very_clean',
    smoking: 'non_smoker',
    pets: 'no_pets',
    sleep_schedule: 'early_bird',
    guests: 'rarely',
    noise_level: 'quiet',
    bio: 'Finance analyst at a boutique firm. Up by 6am, in bed by 10pm. Keeps a very tidy home and expects the same.',
    is_complete: true,
    initials: 'JO',
    accent_color: '#10b981',
  },
  {
    user_id: 'u-004',
    display_name: 'Sofia Marin',
    age: 22,
    city: 'London',
    housing_status: 'LOOKING',
    budget_min: 600,
    budget_max: 900,
    cleanliness: 'moderate',
    smoking: 'non_smoker',
    pets: 'has_pets',
    sleep_schedule: 'night_owl',
    guests: 'sometimes',
    noise_level: 'lively',
    bio: 'Fine art student at Central Saint Martins. I have a small cat named Bauhaus. Looking for a creative, open-minded flatmate.',
    is_complete: true,
    initials: 'SM',
    accent_color: '#ec4899',
  },
  {
    user_id: 'u-005',
    display_name: 'Tom Whitfield',
    age: 26,
    city: 'London',
    housing_status: 'HAS_APARTMENT',
    budget_min: 1100,
    budget_max: 1600,
    cleanliness: 'clean',
    smoking: 'non_smoker',
    pets: 'no_pets',
    sleep_schedule: 'flexible',
    guests: 'sometimes',
    noise_level: 'moderate',
    bio: 'Software developer working remotely. I work from home most days so need a productive environment. Great cook. Happy to share recipes.',
    is_complete: true,
    initials: 'TW',
    accent_color: '#3b82f6',
  },
  {
    user_id: 'u-006',
    display_name: 'Amara Diallo',
    age: 27,
    city: 'London',
    housing_status: 'LOOKING',
    budget_min: 800,
    budget_max: 1100,
    cleanliness: 'very_clean',
    smoking: 'non_smoker',
    pets: 'no_pets',
    sleep_schedule: 'early_bird',
    guests: 'rarely',
    noise_level: 'quiet',
    bio: 'NHS nurse on rotating shifts, often home during the day. Need a quiet environment to sleep at odd hours. Very clean and organised.',
    is_complete: true,
    initials: 'AD',
    accent_color: '#8b5cf6',
  },
  {
    user_id: 'u-007',
    display_name: 'Luca Ferri',
    age: 23,
    city: 'London',
    housing_status: 'LOOKING',
    budget_min: 700,
    budget_max: 1000,
    cleanliness: 'relaxed',
    smoking: 'outside_only',
    pets: 'no_pets',
    sleep_schedule: 'night_owl',
    guests: 'often',
    noise_level: 'lively',
    bio: 'Architecture student. My sleep schedule is chaotic during deadlines. Love having people over. Looking for a social, easygoing flatmate.',
    is_complete: true,
    initials: 'LF',
    accent_color: '#ef4444',
  },
  {
    user_id: 'u-008',
    display_name: 'Hannah Park',
    age: 25,
    city: 'London',
    housing_status: 'LOOKING',
    budget_min: 1000,
    budget_max: 1400,
    cleanliness: 'clean',
    smoking: 'non_smoker',
    pets: 'ok_with_pets',
    sleep_schedule: 'flexible',
    guests: 'sometimes',
    noise_level: 'moderate',
    bio: 'Marketing manager at a tech startup. Work hard, play hard. Good communicator and very respectful of shared spaces.',
    is_complete: true,
    initials: 'HP',
    accent_color: '#14b8a6',
  },
  {
    user_id: 'u-009',
    display_name: 'Ravi Patel',
    age: 28,
    city: 'London',
    housing_status: 'HAS_APARTMENT',
    budget_min: 1200,
    budget_max: 1700,
    cleanliness: 'very_clean',
    smoking: 'non_smoker',
    pets: 'no_pets',
    sleep_schedule: 'flexible',
    guests: 'rarely',
    noise_level: 'quiet',
    bio: 'Data scientist. I keep the flat immaculate and would love a flatmate who does the same. Big into cooking and board games on weekends.',
    is_complete: true,
    initials: 'RP',
    accent_color: '#f97316',
  },
];

// Profiles that will generate a mutual match when liked.
const MATCH_PROFILE_IDS = new Set(['u-002', 'u-005', 'u-008']);

const DUMMY_MATCHES = [
  {
    match_id: 'm-001',
    matched_user_id: 'u-002',
    matched_user_name: 'Priya Sharma',
    matched_user_initials: 'PS',
    matched_user_accent: '#6366f1',
    last_message: 'Sounds perfect! When can we talk?',
    last_message_at: '2025-03-07T18:30:00Z',
  },
  {
    match_id: 'm-002',
    matched_user_id: 'u-005',
    matched_user_name: 'Tom Whitfield',
    matched_user_initials: 'TW',
    matched_user_accent: '#3b82f6',
    last_message: "I work remotely so I'm home a lot, just FYI",
    last_message_at: '2025-03-06T11:00:00Z',
  },
  {
    match_id: 'm-003',
    matched_user_id: 'u-008',
    matched_user_name: 'Hannah Park',
    matched_user_initials: 'HP',
    matched_user_accent: '#14b8a6',
    last_message: 'What area of London are you looking at?',
    last_message_at: '2025-03-05T20:15:00Z',
  },
];

const DUMMY_MESSAGES = {
  'm-001': [
    { message_id: 'msg-001', match_id: 'm-001', sender_id: 'u-002', body: "Hi! I saw your profile and I think we could be a great match. I'm in Bloomsbury most days for my PhD.", created_at: '2025-03-07T16:00:00Z' },
    { message_id: 'msg-002', match_id: 'm-001', sender_id: 'u-001', body: "Hey Priya! That sounds amazing. I'm also looking around zones 1-2. Do you have a move-in date in mind?", created_at: '2025-03-07T16:15:00Z' },
    { message_id: 'msg-003', match_id: 'm-001', sender_id: 'u-002', body: "I was thinking end of April. My current tenancy runs out on the 30th.", created_at: '2025-03-07T16:20:00Z' },
    { message_id: 'msg-004', match_id: 'm-001', sender_id: 'u-001', body: "That works perfectly for me. What's your approach to cleaning? I like to stay on top of it.", created_at: '2025-03-07T17:00:00Z' },
    { message_id: 'msg-005', match_id: 'm-001', sender_id: 'u-002', body: "Same! I do a proper clean every Sunday and keep the kitchen tidy after every meal. Non-negotiable for me honestly.", created_at: '2025-03-07T17:10:00Z' },
    { message_id: 'msg-006', match_id: 'm-001', sender_id: 'u-001', body: "That's exactly what I was hoping to hear. Budget-wise I'm comfortable up to £1,400 — does that give us enough to find something decent?", created_at: '2025-03-07T18:00:00Z' },
    { message_id: 'msg-007', match_id: 'm-001', sender_id: 'u-002', body: "Sounds perfect! When can we talk?", created_at: '2025-03-07T18:30:00Z' },
  ],
  'm-002': [
    { message_id: 'msg-008', match_id: 'm-002', sender_id: 'u-001', body: "Hey Tom! Your profile stood out — another dev here. Do you find working from home affects what you need in a flatmate?", created_at: '2025-03-06T09:00:00Z' },
    { message_id: 'msg-009', match_id: 'm-002', sender_id: 'u-005', body: "100%. I need decent wifi and a quiet environment during the day. I'm very respectful of shared spaces though.", created_at: '2025-03-06T09:20:00Z' },
    { message_id: 'msg-010', match_id: 'm-002', sender_id: 'u-001', body: "Good to know. I'm usually out at uni during the day so that works. How are you with guests?", created_at: '2025-03-06T09:35:00Z' },
    { message_id: 'msg-011', match_id: 'm-002', sender_id: 'u-005', body: "Totally fine occasionally, just a heads-up beforehand. I'm the same — might have a friend over on Fridays sometimes.", created_at: '2025-03-06T09:50:00Z' },
    { message_id: 'msg-012', match_id: 'm-002', sender_id: 'u-001', body: "Sounds reasonable. Do you cook much? I'd be open to sharing costs on basics.", created_at: '2025-03-06T10:20:00Z' },
    { message_id: 'msg-013', match_id: 'm-002', sender_id: 'u-005', body: "I work remotely so I'm home a lot, just FYI", created_at: '2025-03-06T11:00:00Z' },
  ],
  'm-003': [
    { message_id: 'msg-014', match_id: 'm-003', sender_id: 'u-008', body: "Hi! Love that you're also looking in London. How long have you been searching?", created_at: '2025-03-05T18:00:00Z' },
    { message_id: 'msg-015', match_id: 'm-003', sender_id: 'u-001', body: "About a month now. It's quite competitive! I'm open to zones 2-4 if the place is nice.", created_at: '2025-03-05T18:15:00Z' },
    { message_id: 'msg-016', match_id: 'm-003', sender_id: 'u-008', body: "Same — I've been focusing on Hackney and Peckham. Both great areas, good transport.", created_at: '2025-03-05T18:30:00Z' },
    { message_id: 'msg-017', match_id: 'm-003', sender_id: 'u-001', body: "Hackney would be great. Are you looking for bills included or separate?", created_at: '2025-03-05T19:00:00Z' },
    { message_id: 'msg-018', match_id: 'm-003', sender_id: 'u-008', body: "Prefer bills included — easier to budget. I'm fine going up to £1,400 with bills.", created_at: '2025-03-05T19:20:00Z' },
    { message_id: 'msg-019', match_id: 'm-003', sender_id: 'u-001', body: "That aligns really well. Are you okay with one very small, well-behaved pet? Just asking in advance.", created_at: '2025-03-05T19:50:00Z' },
    { message_id: 'msg-020', match_id: 'm-003', sender_id: 'u-008', body: "What area of London are you looking at?", created_at: '2025-03-05T20:15:00Z' },
  ],
};

// ─── FlatmateApiClient ─────────────────────────────────────────────────────

export default class FlatmateApiClient {
  // Private mutable dummy state — mutated by like/sendMessage/updateProfile.
  #likedProfileIds = new Set();
  #newMatches = [];
  #messagesByMatch = structuredClone(DUMMY_MESSAGES);
  #currentUserProfile = { ...CURRENT_USER };

  // ─── Core routing method ──────────────────────────────────────────────────

  /**
   * Routes a request to the appropriate dummy handler by HTTP method and URL.
   *
   * This is the ONLY method that changes when the Flask backend is connected.
   * Replace the entire body with a real fetch() call; all callers stay the same.
   *
   * @param {Object} options - Request options.
   * @param {string} options.method - HTTP method ('GET', 'POST', 'PUT', 'DELETE').
   * @param {string} options.url - API path (e.g. '/auth/login').
   * @param {Object} [options.body] - Request body for POST/PUT.
   * @param {Object} [options.query] - Query parameters for GET.
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async request(options) {
    const { method, url, body } = options;

    // Auth
    if (method === 'POST' && url === '/auth/register') {
      return this.#handleRegister(body);
    }
    if (method === 'POST' && url === '/auth/login') {
      return this.#handleLogin(body);
    }
    if (method === 'DELETE' && url === '/auth/logout') {
      return { ok: true, status: 204, body: null };
    }

    // Profile
    if (method === 'GET' && url === '/profiles/me') {
      return { ok: true, status: 200, body: { user: { ...this.#currentUserProfile } } };
    }
    if (method === 'PUT' && url === '/profiles/me') {
      return this.#handleUpdateProfile(body);
    }

    // Discovery feed
    if (method === 'GET' && url === '/profiles') {
      return this.#handleGetProfiles();
    }

    // Like / Pass
    const likeMatch = url.match(/^\/profiles\/([\w-]+)\/like$/);
    if (method === 'POST' && likeMatch) {
      return this.#handleLike(likeMatch[1]);
    }
    const passMatch = url.match(/^\/profiles\/([\w-]+)\/pass$/);
    if (method === 'POST' && passMatch) {
      this.#likedProfileIds.add(passMatch[1]);
      return { ok: true, status: 200, body: { passed: true } };
    }

    // Matches
    if (method === 'GET' && url === '/matches') {
      return {
        ok: true,
        status: 200,
        body: { matches: [...DUMMY_MATCHES, ...this.#newMatches] },
      };
    }

    // Messages
    const messagesGetMatch = url.match(/^\/matches\/([\w-]+)\/messages$/);
    if (method === 'GET' && messagesGetMatch) {
      return this.#handleGetMessages(messagesGetMatch[1]);
    }
    const messagesPostMatch = url.match(/^\/matches\/([\w-]+)\/messages$/);
    if (method === 'POST' && messagesPostMatch) {
      return this.#handleSendMessage(messagesPostMatch[1], body);
    }

    return { ok: false, status: 404, body: { error: 'Endpoint not found in dummy mode' } };
  }

  // ─── Base HTTP verb methods ───────────────────────────────────────────────

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

  // ─── Domain methods ───────────────────────────────────────────────────────

  /**
   * Logs in a user with email and password.
   *
   * In dummy mode accepts any credentials. When the backend lands,
   * this method stays identical — only request() changes.
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
   * In dummy mode succeeds immediately. The returned user has is_complete
   * set to false to trigger the onboarding flow.
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

  // ─── Private dummy handlers ───────────────────────────────────────────────

  /**
   * Handles dummy user registration.
   *
   * @param {Object} body - Request body containing email and password.
   * @returns {{ok: boolean, status: number, body: {user: Object}}}
   */
  #handleRegister(body) {
    const newUser = {
      ...CURRENT_USER,
      email: body.email || 'user@example.com',
      is_complete: false,
    };
    return { ok: true, status: 201, body: { user: newUser } };
  }

  /**
   * Handles dummy login.
   *
   * @param {Object} body - Request body containing email and password.
   * @returns {{ok: boolean, status: number, body: {user: Object}}}
   */
  #handleLogin(body) {
    const loggedInUser = {
      ...this.#currentUserProfile,
      email: body.email || CURRENT_USER.email,
    };
    return { ok: true, status: 200, body: { user: loggedInUser } };
  }

  /**
   * Handles the discovery feed request, excluding already-acted profiles.
   *
   * @returns {{ok: boolean, status: number, body: {profiles: Object[]}}}
   */
  #handleGetProfiles() {
    const unseen = BROWSE_PROFILES.filter(
      (profile) => !this.#likedProfileIds.has(profile.user_id),
    );
    return { ok: true, status: 200, body: { profiles: unseen } };
  }

  /**
   * Handles a LIKE action. Creates a match if the target is in MATCH_PROFILE_IDS.
   *
   * @param {string} userId - The user_id of the liked profile.
   * @returns {{ok: boolean, status: number, body: {matched: boolean, match: Object|null}}}
   */
  #handleLike(userId) {
    this.#likedProfileIds.add(userId);

    if (!MATCH_PROFILE_IDS.has(userId)) {
      return { ok: true, status: 200, body: { matched: false, match: null } };
    }

    // Check if a match already exists (pre-seeded or created in this session).
    const allMatches = [...DUMMY_MATCHES, ...this.#newMatches];
    const existing = allMatches.find((m) => m.matched_user_id === userId);
    if (existing) {
      return { ok: true, status: 200, body: { matched: true, match: existing } };
    }

    const profile = BROWSE_PROFILES.find((p) => p.user_id === userId);
    const newMatch = {
      match_id: `m-new-${userId}`,
      matched_user_id: userId,
      matched_user_name: profile.display_name,
      matched_user_initials: profile.initials,
      matched_user_accent: profile.accent_color,
      last_message: null,
      last_message_at: new Date().toISOString(),
    };
    this.#newMatches.push(newMatch);
    this.#messagesByMatch[newMatch.match_id] = [];

    return { ok: true, status: 200, body: { matched: true, match: newMatch } };
  }

  /**
   * Retrieves messages for a match conversation.
   *
   * @param {string} matchId - The match to retrieve messages for.
   * @returns {{ok: boolean, status: number, body: {messages: Object[]}}}
   */
  #handleGetMessages(matchId) {
    const messages = this.#messagesByMatch[matchId] ?? [];
    return { ok: true, status: 200, body: { messages } };
  }

  /**
   * Appends a new message to a match conversation.
   *
   * @param {string} matchId - The match to send the message to.
   * @param {Object} body - Request body containing the message text.
   * @returns {{ok: boolean, status: number, body: {message: Object}}}
   */
  #handleSendMessage(matchId, body) {
    const newMessage = {
      message_id: `msg-${crypto.randomUUID()}`,
      match_id: matchId,
      sender_id: 'u-001',
      body: body.body,
      created_at: new Date().toISOString(),
    };
    if (!this.#messagesByMatch[matchId]) {
      this.#messagesByMatch[matchId] = [];
    }
    this.#messagesByMatch[matchId].push(newMessage);
    return { ok: true, status: 201, body: { message: newMessage } };
  }

  /**
   * Merges new profile data into the current user's profile.
   *
   * @param {Object} profileData - Partial profile fields to update.
   * @returns {{ok: boolean, status: number, body: {user: Object}}}
   */
  #handleUpdateProfile(profileData) {
    this.#currentUserProfile = {
      ...this.#currentUserProfile,
      ...profileData,
      is_complete: true,
    };
    return { ok: true, status: 200, body: { user: { ...this.#currentUserProfile } } };
  }
}
