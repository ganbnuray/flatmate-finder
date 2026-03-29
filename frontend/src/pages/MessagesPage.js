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
  Dropdown,
} from 'react-bootstrap';
import { useApi } from '../contexts/ApiProvider';
import { useUser } from '../contexts/UserProvider';
import { getInitials, getAccentColor } from '../utils/avatarHelpers';

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
        setMessages(response.body);
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
   * @param {React.FormEvent} event - The form submit event.
   * @returns {Promise<void>}
   */
  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (!newMessage.trim() || !matchId) return;

      setSending(true);
      setSendError('');
      const response = await api.sendMessage(matchId, newMessage.trim());
      if (response.ok) {
        setMessages((prev) => {
          const msg = response.body;
          if (prev.some((m) => m.id === msg.id)) return prev;
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

  const handleBlock = async () => {
    if (!activeMatch) return;
    if (window.confirm(`Are you sure you want to block ${activeMatch.display_name}? This conversation will be removed.`)) {
      const response = await api.blockUser(activeMatch.user_id);
      if (response.ok) {
        // Remove match locally and navigate away from chat
        setMatches((prev) => prev.filter((m) => m.match_id !== matchId));
        navigate('/messages', { replace: true });
      } else {
        alert('Failed to block user. Please try again.');
      }
    }
  };

  const handleReport = async () => {
    if (!activeMatch) return;
    const reasonPrompt = window.prompt(
      `Why are you reporting ${activeMatch.display_name}?\n\nOptions: spam, harassment, fake_profile, inappropriate_content, other`,
      'other'
    );
    
    if (!reasonPrompt) return; // User cancelled

    const validReasons = ['spam', 'harassment', 'fake_profile', 'inappropriate_content', 'other'];
    let reason = reasonPrompt.trim().toLowerCase();
    
    if (!validReasons.includes(reason)) {
      alert(`Invalid reason. Must be one of: ${validReasons.join(', ')}`);
      return;
    }

    const details = window.prompt('Please provide any additional details (optional):') || '';

    const response = await api.reportUser(activeMatch.user_id, reason, details);
    if (response.ok) {
      alert('User reported successfully.');
    } else {
      alert('Failed to report user. Please try again.');
    }
  };

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
                    style={{ backgroundColor: getAccentColor(match.user_id) }}
                  >
                    {getInitials(match.display_name)}
                  </div>
                  <div className="sidebar-match-info">
                    <div className="sidebar-match-name">{match.display_name}</div>
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
                <div className="thread-header d-flex justify-content-between align-items-center">
                  {activeMatch && (
                    <>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="profile-avatar-sm"
                          style={{ backgroundColor: getAccentColor(activeMatch.user_id) }}
                        >
                          {getInitials(activeMatch.display_name)}
                        </div>
                        <span className="fw-semibold">
                          {activeMatch.display_name}
                        </span>
                      </div>
                      
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="text-muted p-0 border-0 text-decoration-none fs-5">
                          ⋮
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={handleReport} className="text-warning">
                            Report
                          </Dropdown.Item>
                          <Dropdown.Item onClick={handleBlock} className="text-danger">
                            Block
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </>
                  )}
                </div>

                {/* Messages */}
                <div className="thread-messages">
                  {messages.map((msg) => {
                    const isSent = msg.sender_id === user?.user_id;
                    return (
                      <div
                        key={msg.id}
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

                {/* Send error */}
                {sendError && (
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setSendError('')}
                    className="mx-3 mb-0"
                  >
                    {sendError}
                  </Alert>
                )}

                {/* Input */}
                <div className="thread-input-area">
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
