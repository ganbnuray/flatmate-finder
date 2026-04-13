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
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  const [refreshing, setRefreshing] = useState(false);
  const [, setReadVersion] = useState(0);

  // Ref to the bottom of the message list for auto-scroll.
  const threadEndRef = useRef(null);
  const threadContainerRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const LAST_READ_PREFIX = 'flatmate:last_read:';

  const getLastReadAt = useCallback(
    (targetMatchId) => {
      if (!targetMatchId) return 0;
      const stored = localStorage.getItem(`${LAST_READ_PREFIX}${targetMatchId}`);
      return stored ? new Date(stored).getTime() : 0;
    },
    [LAST_READ_PREFIX],
  );

  const markMatchRead = useCallback(
    (targetMatchId, timestamp) => {
      if (!targetMatchId || !timestamp) return;
      localStorage.setItem(`${LAST_READ_PREFIX}${targetMatchId}`, timestamp);
      setReadVersion((prev) => prev + 1);
    },
    [LAST_READ_PREFIX, setReadVersion],
  );

  const handleThreadScroll = useCallback(() => {
    const container = threadContainerRef.current;
    if (!container) return;
    const threshold = 48;
    isAtBottomRef.current =
      container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
  }, []);

  const fetchMatches = useCallback(async () => {
    const response = await api.getMatches();
    if (response.ok) {
      setMatches(response.body.matches);
    }
  }, [api]);

  const fetchMessages = useCallback(async () => {
    if (!matchId) {
      setMessages([]);
      return;
    }
    const response = await api.getMessages(matchId);
    if (response.ok) {
      setMessages(response.body);
    }
  }, [api, matchId]);

  const refreshConversation = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) {
        setRefreshing(true);
      }
      await Promise.all([fetchMatches(), fetchMessages()]);
      if (showSpinner) {
        setRefreshing(false);
      }
    },
    [fetchMatches, fetchMessages],
  );

  // Fetch all matches for the sidebar on mount.
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Fetch messages whenever the active match changes.
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auto-refresh the active thread for new messages.
  useEffect(() => {
    if (!matchId) return;
    const interval = setInterval(() => {
      refreshConversation(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [matchId, refreshConversation]);

  // Reset scroll behavior when switching threads.
  useEffect(() => {
    isAtBottomRef.current = true;
  }, [matchId]);

  // Scroll to the bottom only when the user is already near the end.
  useEffect(() => {
    if (isAtBottomRef.current) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark the active conversation as read after loading messages.
  useEffect(() => {
    if (!matchId || messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (latest?.created_at) {
      markMatchRead(matchId, latest.created_at);
    }
  }, [matchId, messages, markMatchRead]);

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
        setMatches((prev) =>
          prev.map((match) =>
            match.match_id === matchId
              ? {
                  ...match,
                  last_message: response.body.body,
                  last_message_at: response.body.created_at,
                  last_message_sender_id: response.body.sender_id,
                }
              : match,
          ),
        );
        markMatchRead(matchId, response.body.created_at);
        setNewMessage('');
      } else {
        setSendError('Failed to send message. Please try again.');
      }
      setSending(false);
    },
    [api, matchId, newMessage, markMatchRead],
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

  const hasUnread = (match) => {
    if (!match?.last_message_at || !match.last_message) return false;
    if (match.last_message_sender_id && match.last_message_sender_id === user?.user_id) {
      return false;
    }
    const lastReadAt = getLastReadAt(match.match_id);
    const lastMessageAt = new Date(match.last_message_at).getTime();
    return lastMessageAt > lastReadAt;
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
                  <Link
                    to={`/profiles/${match.user_id}`}
                    className="sidebar-profile-link"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div
                      className="profile-avatar-sm"
                      style={{ backgroundColor: getAccentColor(match.user_id) }}
                    >
                      {getInitials(match.display_name)}
                    </div>
                  </Link>
                  <div className="sidebar-match-info">
                    <div className="d-flex align-items-center gap-2">
                      <Link
                        to={`/profiles/${match.user_id}`}
                        className="sidebar-profile-link sidebar-match-name"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {match.display_name}
                      </Link>
                      {hasUnread(match) && <span className="sidebar-unread-dot" />}
                    </div>
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
                      <Link
                        to={`/profiles/${activeMatch.user_id}`}
                        className="thread-profile-link d-flex align-items-center gap-2"
                      >
                        <div
                          className="profile-avatar-sm"
                          style={{ backgroundColor: getAccentColor(activeMatch.user_id) }}
                        >
                          {getInitials(activeMatch.display_name)}
                        </div>
                        <span className="fw-semibold">
                          {activeMatch.display_name}
                        </span>
                      </Link>

                      <div className="d-flex align-items-center gap-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => refreshConversation(true)}
                          disabled={refreshing}
                        >
                          {refreshing ? 'Refreshing…' : 'Refresh'}
                        </Button>
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
                      </div>
                    </>
                  )}
                </div>

                {/* Messages */}
                <div
                  className="thread-messages"
                  ref={threadContainerRef}
                  onScroll={handleThreadScroll}
                >
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
