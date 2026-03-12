/**
 * @fileoverview MessagesPage — two-column messaging interface.
 *
 * Left sidebar: scrollable list of all matches, with the active one
 * highlighted. Right panel: the message thread for the selected match,
 * or an empty state if none is selected.
 *
 * The active match ID is driven by the :matchId URL parameter so that
 * direct navigation to /messages/m-001 opens that conversation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
} from 'react-bootstrap';
import { useApi } from '../contexts/ApiProvider';
import { useUser } from '../contexts/UserProvider';

/**
 * Formats an ISO timestamp to a short time string (HH:MM).
 *
 * @param {string} isoString - ISO 8601 timestamp.
 * @returns {string} Formatted time such as "14:35".
 */
function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Renders the two-column messaging interface.
 *
 * State:
 *   matches      — all matches, used to populate the sidebar.
 *   messages     — messages for the currently active match.
 *   newMessage   — the current value of the message input.
 *   sending      — true while a send request is in flight.
 *   sendError    — non-empty string when a send API call fails.
 *
 * @returns {JSX.Element} The messages page.
 */
export default function MessagesPage() {
  const api = useApi();
  const { user } = useUser();
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // Ref to the bottom of the message list for auto-scroll.
  const threadEndRef = useRef(null);

  // Fetch all matches for the sidebar on mount.
  useEffect(() => {
    (async () => {
      const response = await api.getMatches();
      if (response.ok) {
        setMatches(response.body.matches);
      }
    })();
  }, [api]);

  // Fetch messages whenever the active match changes.
  useEffect(() => {
    if (!matchId) {
      setMessages([]);
      return;
    }
    (async () => {
      const response = await api.getMessages(matchId);
      if (response.ok) {
        setMessages(response.body.messages);
      }
    })();
  }, [api, matchId]);

  // Scroll to the bottom of the thread whenever messages change.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Sends the current message and appends it to the thread on success.
   *
   * @param {Event} event - The form submit event.
   * @returns {Promise<void>}
   */
  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (!newMessage.trim() || !matchId) return;

      setSendError('');
      setSending(true);
      const response = await api.sendMessage(matchId, newMessage.trim());
      if (response.ok) {
        // Deduplicate by message_id: React 18 StrictMode can call the async
        // setState callback twice in development (fast-remount behaviour), which
        // would produce a duplicate without this guard.
        setMessages((prev) => {
          const msg = response.body.message;
          if (prev.some((m) => m.message_id === msg.message_id)) return prev;
          return [...prev, msg];
        });
        setNewMessage('');
      } else {
        setSendError('Failed to send message. Please try again.');
      }
      setSending(false);
    },
    [api, matchId, newMessage],
  );

  const activeMatch = matches.find((m) => m.match_id === matchId);

  return (
    <div className="messages-page">
      <Container fluid="lg">
        <Row className="messages-layout g-0">
          {/* Left sidebar: match list */}
          <Col md={4} lg={3} className="messages-sidebar">
            <div className="sidebar-header">
              <h5 className="sidebar-title">Messages</h5>
            </div>
            <div className="sidebar-list">
              {matches.length === 0 && (
                <div className="text-muted-custom small p-3">
                  No matches yet.
                </div>
              )}
              {matches.map((match) => (
                <button
                  key={match.match_id}
                  className={`sidebar-match-item ${match.match_id === matchId ? 'active' : ''}`}
                  onClick={() => navigate(`/messages/${match.match_id}`)}
                  type="button"
                >
                  <div
                    className="profile-avatar-sm"
                    style={{ backgroundColor: match.matched_user_accent }}
                  >
                    {match.matched_user_initials}
                  </div>
                  <div className="sidebar-match-info">
                    <div className="sidebar-match-name">{match.matched_user_name}</div>
                    <div className="sidebar-match-preview">
                      {match.last_message || 'No messages yet'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Col>

          {/* Right panel: message thread */}
          <Col md={8} lg={9} className="messages-thread-panel">
            {!matchId && (
              <div className="thread-empty-state">
                <div className="empty-state-icon">💬</div>
                <p className="text-muted-custom">
                  Select a conversation to start messaging
                </p>
              </div>
            )}

            {matchId && (
              <div className="thread-layout">
                {/* Thread header */}
                <div className="thread-header">
                  {activeMatch && (
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="profile-avatar-sm"
                        style={{ backgroundColor: activeMatch.matched_user_accent }}
                      >
                        {activeMatch.matched_user_initials}
                      </div>
                      <span className="fw-semibold">
                        {activeMatch.matched_user_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="thread-messages">
                  {messages.map((msg) => {
                    const isSent = msg.sender_id === user?.user_id;
                    return (
                      <div
                        key={msg.message_id}
                        className={`message-row ${isSent ? 'sent' : 'received'}`}
                      >
                        <div className={`message-bubble ${isSent ? 'bubble-sent' : 'bubble-received'}`}>
                          {msg.body}
                        </div>
                        <div className="message-time">
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    );
                  })}
                  {/* Scroll anchor */}
                  <div ref={threadEndRef} />
                </div>

                {/* Input */}
                <div className="thread-input-area">
                  {sendError && (
                    <Alert variant="danger" dismissible onClose={() => setSendError('')} className="mb-2">
                      {sendError}
                    </Alert>
                  )}
                  <Form onSubmit={handleSend} className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      placeholder="Type a message…"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
                      autoComplete="off"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={sending || !newMessage.trim()}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Send
                    </Button>
                  </Form>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}
