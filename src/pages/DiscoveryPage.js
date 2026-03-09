/**
 * @fileoverview DiscoveryPage — the main flatmate browsing feed.
 *
 * Fetches the discovery profile list on mount, then renders one card at
 * a time. Like and Pass actions advance to the next card. When a Like
 * creates a mutual match, a full-screen overlay is shown briefly before
 * advancing. When all profiles have been seen, an empty state is shown.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { useApi } from '../contexts/ApiProvider';
import ProfileCard from '../components/ProfileCard';

/**
 * Renders the discovery feed with one profile card at a time.
 *
 * State:
 *   profiles     — the full list of unseen profiles from the API.
 *   currentIndex — which profile in the list is currently shown.
 *   loading      — true while the initial fetch is in flight.
 *   showMatch    — true for 2 seconds after a mutual like to show the overlay.
 *   matchName    — the matched user's display name for the overlay.
 *   actionError  — non-empty string when a like/pass API call fails.
 *
 * @returns {JSX.Element} The discovery feed page.
 */
export default function DiscoveryPage() {
  const api = useApi();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMatch, setShowMatch] = useState(false);
  const [matchName, setMatchName] = useState('');
  const [actionError, setActionError] = useState('');

  // Fetch profiles once on mount.
  useEffect(() => {
    (async () => {
      const response = await api.getProfiles();
      if (response.ok) {
        setProfiles(response.body.profiles);
      }
      setLoading(false);
    })();
  }, [api]);

  /**
   * Advances to the next profile in the list.
   */
  function advanceCard() {
    setActionError('');
    setCurrentIndex((prev) => prev + 1);
  }

  /**
   * Records a Pass action and advances to the next profile.
   * Does not advance if the API call fails, to avoid silently losing the
   * profile from the feed without the pass being persisted.
   *
   * @returns {Promise<void>}
   */
  async function handlePass() {
    const profile = profiles[currentIndex];
    const response = await api.passProfile(profile.user_id);
    if (response.ok) {
      advanceCard();
    } else {
      setActionError('Failed to record pass. Please try again.');
    }
  }

  /**
   * Records a Like action. If a mutual match is created, shows the match
   * overlay for 2 seconds before advancing. Does not advance if the API
   * call fails.
   *
   * @returns {Promise<void>}
   */
  async function handleLike() {
    const profile = profiles[currentIndex];
    const response = await api.likeProfile(profile.user_id);

    if (!response.ok) {
      setActionError('Failed to record like. Please try again.');
      return;
    }

    if (response.body.matched) {
      setMatchName(profile.display_name);
      setShowMatch(true);
      setTimeout(() => {
        setShowMatch(false);
        advanceCard();
      }, 2000);
    } else {
      advanceCard();
    }
  }

  const currentProfile = profiles[currentIndex];
  const allSeen = !loading && currentIndex >= profiles.length;

  return (
    <div className="discovery-page">
      {/* ── Match overlay ──────────────────────────────────────── */}
      {showMatch && (
        <div className="match-overlay">
          <div className="match-overlay-content">
            <div className="match-overlay-icon">✨</div>
            <h2 className="match-overlay-title">It&apos;s a match!</h2>
            <p className="match-overlay-sub">
              You and <strong>{matchName}</strong> liked each other.
            </p>
          </div>
        </div>
      )}

      <Container>
        {actionError && (
          <Row className="justify-content-center mt-3">
            <Col xs={12} sm={10} md={8} lg={6}>
              <Alert variant="danger" dismissible onClose={() => setActionError('')}>
                {actionError}
              </Alert>
            </Col>
          </Row>
        )}

        {loading && (
          <Row className="justify-content-center">
            <Col className="text-center py-5">
              <div className="text-muted-custom">Loading profiles…</div>
            </Col>
          </Row>
        )}

        {!loading && allSeen && (
          <Row className="justify-content-center">
            <Col xs={12} md={6} className="text-center py-5">
              <div className="empty-state-icon">🌍</div>
              <h3 className="empty-state-title">You&apos;ve seen everyone</h3>
              <p className="text-muted-custom mb-4">
                No more profiles for now. Check back later as new people join —
                or take a look at your existing matches.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/matches')}
              >
                View my matches
              </Button>
            </Col>
          </Row>
        )}

        {!loading && !allSeen && currentProfile && (
          <Row className="justify-content-center">
            <Col xs={12} sm={10} md={8} lg={6}>
              <div className="discovery-counter text-center mb-3">
                <span className="text-muted-custom small">
                  {currentIndex + 1} of {profiles.length} profiles
                </span>
              </div>
              <ProfileCard
                profile={currentProfile}
                onLike={handleLike}
                onPass={handlePass}
              />
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}
