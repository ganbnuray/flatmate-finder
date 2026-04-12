/**
 * @fileoverview MatchesPage — displays all mutual matches for the current user.
 *
 * Fetches the matches list on mount and renders a responsive grid of match
 * cards. Each card links to the messaging view for that match. An empty
 * state encourages the user to continue exploring if no matches exist.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
} from 'react-bootstrap';
import { useApi } from '../contexts/ApiProvider';
import { useUser } from '../contexts/UserProvider';
import { getInitials, getAccentColor } from '../utils/avatarHelpers';

/**
 * Formats an ISO timestamp into a short relative display string.
 *
 * @param {string} isoString - ISO 8601 timestamp string.
 * @returns {string} A human-readable relative time (e.g. "2 days ago").
 */
function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
}

/**
 * Truncates a string to a maximum length, appending an ellipsis if needed.
 *
 * @param {string|null} text - The text to truncate.
 * @param {number} maxLength - Maximum character count before truncation.
 * @returns {string} The truncated string.
 */
function truncate(text, maxLength) {
  if (!text) return 'No messages yet — say hello!';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

/**
 * Renders the matches grid page with a card per mutual match.
 *
 * @returns {JSX.Element} The matches list page.
 */
export default function MatchesPage() {
  const api = useApi();
  const navigate = useNavigate();
  const { user } = useUser();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const LAST_READ_PREFIX = 'flatmate:last_read:';

  const getLastReadAt = (matchId) => {
    const stored = localStorage.getItem(`${LAST_READ_PREFIX}${matchId}`);
    return stored ? new Date(stored).getTime() : 0;
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

  // Fetch matches on mount.
  useEffect(() => {
    (async () => {
      const response = await api.getMatches();
      if (response.ok) {
        setMatches(response.body.matches);
      } else {
        setFetchError(true);
      }
      setLoading(false);
    })();
  }, [api]);

  return (
    <div className="matches-page">
      <Container>
        <div className="page-header mb-4">
          <h2 className="page-title">Your matches</h2>
          <p className="text-muted-custom">
            People who liked you back. Start a conversation.
          </p>
        </div>

        {loading && (
          <p className="text-muted-custom">Loading matches…</p>
        )}

        {!loading && fetchError && (
          <Alert variant="danger">
            Failed to load matches. Please try again later.
          </Alert>
        )}

        {!loading && !fetchError && matches.length === 0 && (
          <div className="text-center empty-state py-5">
            <div className="empty-state-icon">💫</div>
            <h3 className="empty-state-title">No matches yet</h3>
            <p className="text-muted-custom mb-4">
              Keep exploring — your first match is just around the corner.
            </p>
            <Button variant="primary" onClick={() => navigate('/discovery')}>
              Back to discovery
            </Button>
          </div>
        )}

        {!loading && matches.length > 0 && (
          <Row className="g-3">
            {matches.map((match) => (
              <Col key={match.match_id} xs={12} sm={6} md={4} lg={3}>
                <Card className="match-card h-100">
                  <Card.Body className="d-flex flex-column">
                    {/* Avatar */}
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <Link to={`/profiles/${match.user_id}`} className="match-profile-link">
                        <div
                          className="profile-avatar-md"
                          style={{ backgroundColor: getAccentColor(match.user_id) }}
                        >
                          {getInitials(match.display_name)}
                        </div>
                      </Link>
                      <div className="overflow-hidden">
                        <div className="d-flex align-items-center gap-2">
                          <Link
                            to={`/profiles/${match.user_id}`}
                            className="match-profile-link fw-semibold text-truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {match.display_name}
                          </Link>
                          {hasUnread(match) && <span className="match-unread-dot" />}
                        </div>
                        <div className="text-muted-custom small">
                          Matched {formatRelativeTime(match.match_created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Last message preview */}
                    <p className="match-last-message small mb-3 flex-grow-1">
                      {truncate(match.last_message, 60)}
                    </p>

                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="w-100"
                      onClick={() => navigate(`/messages/${match.match_id}`)}
                    >
                      Message
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
}
