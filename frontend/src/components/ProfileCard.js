/**
 * @fileoverview ProfileCard component — displays a single candidate profile
 * in the discovery feed with Like and Pass action buttons.
 *
 * This is a pure presentational component. It receives all data and callbacks
 * through props and never calls useApi(), useUser(), or fetch() directly.
 */

import { Card, Button, Badge, Dropdown } from 'react-bootstrap';
import { getInitials, getAccentColor } from '../utils/avatarHelpers';

/**
 * Maps cleanliness enum values to human-readable labels.
 *
 * @param {string} value - Schema cleanliness_level enum value.
 * @returns {string} Display label.
 */
function cleanlinessLabel(value) {
  const labels = {
    very_clean: 'Very clean',
    clean: 'Clean',
    moderate: 'Moderate',
    relaxed: 'Relaxed',
  };
  return labels[value] || value;
}

/**
 * Maps sleep_schedule enum values to human-readable labels.
 *
 * @param {string} value - Schema sleep_schedule enum value.
 * @returns {string} Display label.
 */
function sleepLabel(value) {
  const labels = {
    early_bird: 'Early bird',
    night_owl: 'Night owl',
    flexible: 'Flexible schedule',
  };
  return labels[value] || value;
}

/**
 * Maps smoking_pref enum values to compact display text.
 *
 * @param {string} value - Schema smoking_pref enum value.
 * @returns {string} Display label.
 */
function smokingLabel(value) {
  const labels = {
    non_smoker: 'Non-smoker',
    outside_only: 'Smokes outside',
    smoker: 'Smoker',
    no_preference: 'No preference',
  };
  return labels[value] || value;
}

/**
 * Maps pets_pref enum values to compact display text.
 *
 * @param {string} value - Schema pets_pref enum value.
 * @returns {string} Display label.
 */
function petsLabel(value) {
  const labels = {
    no_pets: 'No pets',
    has_pets: 'Has pets',
    ok_with_pets: 'Fine with pets',
    no_preference: 'No preference',
  };
  return labels[value] || value;
}

/**
 * Maps housing_status enum to a short descriptor.
 *
 * @param {string} value - Schema housing_status enum value.
 * @returns {string} Display label.
 */
function housingLabel(value) {
  const labels = {
    HAS_APARTMENT: 'Has a place',
    LOOKING: 'Looking for a place',
    EITHER: 'Either',
  };
  return labels[value] || value;
}

/**
 * Renders a full-detail profile card for the discovery feed.
 *
 * @param {Object} props
 * @param {Object} props.profile - Profile data object (schema-aligned fields).
 * @param {string} props.profile.user_id - Unique user identifier.
 * @param {string} props.profile.display_name - Full display name.
 * @param {number} props.profile.age - Age in years.
 * @param {string} props.profile.city - City of residence.
 * @param {string} props.profile.housing_status - housing_status enum value.
 * @param {number} props.profile.budget_min - Minimum monthly budget (£).
 * @param {number} props.profile.budget_max - Maximum monthly budget (£).
 * @param {string} props.profile.cleanliness - cleanliness_level enum value.
 * @param {string} props.profile.smoking - smoking_pref enum value.
 * @param {string} props.profile.pets - pets_pref enum value.
 * @param {string} props.profile.sleep_schedule - sleep_schedule enum value.
 * @param {string} props.profile.bio - Short biography text.
 * @param {string} props.profile.initials - Two-letter initials for the avatar.
 * @param {string} props.profile.accent_color - Hex colour for the avatar background.
 * @param {Function} props.onLike - Callback invoked when the Like button is clicked.
 * @param {Function} props.onPass - Callback invoked when the Pass button is clicked.
 * @param {Function} [props.onBlock] - Optional callback to block the profile user.
 * @returns {JSX.Element} A styled Bootstrap Card.
 */
export default function ProfileCard({ profile, onLike, onPass, onBlock }) {
  return (
    <Card className="profile-discovery-card mx-auto">
      <Card.Body className="p-4 position-relative">
        {/* Actions Dropdown */}
        {onBlock && (
          <Dropdown className="position-absolute top-0 end-0 m-3">
            <Dropdown.Toggle variant="link" className="text-muted p-0 border-0 fs-5 text-decoration-none">
              ⋮
            </Dropdown.Toggle>
            <Dropdown.Menu align="end">
              <Dropdown.Item onClick={onBlock} className="text-danger">
                Block {profile.display_name}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}

        {/* Avatar */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div
            className="profile-avatar-lg"
            style={{ backgroundColor: getAccentColor(profile.user_id) }}
          >
            {getInitials(profile.display_name)}
          </div>
          <div>
            <h4 className="mb-0 fw-semibold">
              {profile.display_name}, {profile.age}
            </h4>
            <span className="text-muted-custom small">
              {profile.city} · {housingLabel(profile.housing_status)}
            </span>
          </div>
        </div>

        {/* Budget */}
        <div className="mb-3">
          <span className="profile-stat-label">Budget</span>
          <span className="profile-stat-value">
            £{(profile.budget_min ?? 0).toLocaleString()} – £{(profile.budget_max ?? 0).toLocaleString()}
            /mo
          </span>
        </div>

        {/* Lifestyle badges */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          <Badge className="profile-badge">{cleanlinessLabel(profile.cleanliness)}</Badge>
          <Badge className="profile-badge">{sleepLabel(profile.sleep_schedule)}</Badge>
          <Badge className="profile-badge">{smokingLabel(profile.smoking)}</Badge>
          <Badge className="profile-badge">{petsLabel(profile.pets)}</Badge>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="profile-bio mb-4">{profile.bio}</p>
        )}

        {/* Action buttons */}
        <div className="d-flex gap-3 justify-content-center">
          <Button
            variant="outline-secondary"
            size="lg"
            className="profile-action-btn"
            onClick={onPass}
            aria-label="Pass"
          >
            ✕ Pass
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="profile-action-btn"
            onClick={onLike}
            aria-label="Like"
          >
            ♥ Like
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
