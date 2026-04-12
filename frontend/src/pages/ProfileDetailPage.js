/**
 * @fileoverview ProfileDetailPage — read-only profile view for matched users.
 *
 * Fetches a matched user's profile and presents it in a read-only layout.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { useApi } from '../contexts/ApiProvider';
import { getAccentColor, getInitials } from '../utils/avatarHelpers';

/** Human-readable labels for enum values displayed in read mode. */
const LABELS = {
  cleanliness: {
    very_clean: 'Very clean',
    clean: 'Clean',
    moderate: 'Moderate',
    relaxed: 'Relaxed',
  },
  smoking: {
    non_smoker: 'Non-smoker',
    outside_only: 'Smokes outside',
    smoker: 'Smoker',
    no_preference: 'No preference',
  },
  pets: {
    no_pets: 'No pets',
    has_pets: 'Has pets',
    ok_with_pets: 'Fine with pets',
    no_preference: 'No preference',
  },
  sleep_schedule: {
    early_bird: 'Early bird',
    flexible: 'Flexible',
    night_owl: 'Night owl',
  },
  housing_status: {
    HAS_APARTMENT: 'Has a place',
    LOOKING: 'Looking for a place',
    LOOKING_WITH_FLATMATE: 'Looking for a place + flatmate',
    EITHER: 'Either',
  },
  guests: {
    rarely: 'Rarely has guests',
    sometimes: 'Occasionally',
    often: 'Often — social household',
    no_preference: 'No preference',
  },
  noise_level: {
    quiet: 'Quiet',
    moderate: 'Moderate',
    lively: 'Lively',
  },
  gender: {
    woman: 'Woman',
    man: 'Man',
    non_binary: 'Non-binary',
    other: 'Other',
    prefer_not_say: 'Prefer not to say',
  },
};

/**
 * Resolves an enum value to its human-readable label.
 *
 * @param {string} category - The enum category key in LABELS.
 * @param {string} value - The raw enum value from the schema.
 * @returns {string} The display label, or the raw value if not found.
 */
function label(category, value) {
  return LABELS[category]?.[value] ?? value;
}

/**
 * Displays a matched user's profile in read-only form.
 *
 * @returns {JSX.Element} The profile detail page.
 */
export default function ProfileDetailPage() {
  const api = useApi();
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      setError('');

      const response = await api.getProfile(userId);
      if (!isMounted) return;

      if (response.ok) {
        setProfile(response.body);
      } else {
        setError('Unable to load this profile. Please try again.');
      }
      setLoading(false);
    }

    if (userId) {
      loadProfile();
    } else {
      setError('Missing profile identifier.');
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [api, userId]);

  if (loading) {
    return (
      <div className="profile-page">
        <Container>
          <p className="text-muted-custom">Loading profile…</p>
        </Container>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <Container>
          <Alert variant="danger">{error || 'Profile not found.'}</Alert>
          <Button variant="outline-secondary" onClick={() => navigate('/matches')}>
            Back to matches
          </Button>
        </Container>
      </div>
    );
  }

  const locationParts = [
    label('gender', profile.gender),
    profile.neighborhood,
    profile.city,
  ].filter(Boolean);
  const locationText = locationParts.join(' · ');

  return (
    <div className="profile-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8} xl={7}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="profile-avatar-lg"
                  style={{ backgroundColor: getAccentColor(profile.user_id) }}
                >
                  {getInitials(profile.display_name)}
                </div>
                <div>
                  <h2 className="page-title mb-0">{profile.display_name}</h2>
                  <span className="text-muted-custom small">
                    {locationText || 'Profile details'}
                  </span>
                </div>
              </div>
              <Button variant="outline-secondary" size="sm" onClick={() => navigate('/matches')}>
                Back to matches
              </Button>
            </div>

            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Card className="mb-3">
              <Card.Body>
                <h6 className="profile-section-label">About</h6>
                <Row className="g-2 mb-3">
                  <Col xs={6} md={3}>
                    <span className="profile-detail-label">Age</span>
                    <span className="profile-detail-value">{profile.age}</span>
                  </Col>
                  <Col xs={6} md={3}>
                    <span className="profile-detail-label">Gender</span>
                    <span className="profile-detail-value">{label('gender', profile.gender)}</span>
                  </Col>
                  <Col xs={6} md={3}>
                    <span className="profile-detail-label">City</span>
                    <span className="profile-detail-value">{profile.city}</span>
                  </Col>
                  <Col xs={6} md={3}>
                    <span className="profile-detail-label">Neighborhood</span>
                    <span className="profile-detail-value">{profile.neighborhood}</span>
                  </Col>
                  <Col xs={12} md={6}>
                    <span className="profile-detail-label">Situation</span>
                    <span className="profile-detail-value">
                      {label('housing_status', profile.housing_status)}
                    </span>
                  </Col>
                  <Col xs={12} md={6}>
                    <span className="profile-detail-label">Budget</span>
                    <span className="profile-detail-value">
                      {'$'}
                      {profile.budget_min?.toLocaleString()} – {'$'}
                      {profile.budget_max?.toLocaleString()}/mo
                    </span>
                  </Col>
                </Row>

                <h6 className="profile-section-label">Lifestyle</h6>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <Badge className="profile-badge">{label('cleanliness', profile.cleanliness)}</Badge>
                  <Badge className="profile-badge">{label('sleep_schedule', profile.sleep_schedule)}</Badge>
                  <Badge className="profile-badge">{label('smoking', profile.smoking)}</Badge>
                  <Badge className="profile-badge">{label('pets', profile.pets)}</Badge>
                  <Badge className="profile-badge">{label('guests', profile.guests)}</Badge>
                  <Badge className="profile-badge">{label('noise_level', profile.noise_level)}</Badge>
                </div>

                {profile.bio && (
                  <>
                    <h6 className="profile-section-label">Bio</h6>
                    <p className="profile-bio mb-0">{profile.bio}</p>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
