/**
 * @fileoverview ProfilePage — view and edit the current user's profile.
 *
 * Reads user data directly from UserProvider (no redundant API call —
 * the current user is already available in context). Edit mode renders
 * the same field set as OnboardingPage. Saving calls updateProfile()
 * from UserProvider so all context consumers see the change immediately.
 */

import { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
} from 'react-bootstrap';
import { useUser } from '../contexts/UserProvider';

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
 * Renders the profile view/edit page for the currently authenticated user.
 *
 * The user object is read from UserProvider — no API call is needed because
 * the current user is already available in shared auth state.
 *
 * @returns {JSX.Element} The profile page.
 */
export default function ProfilePage() {
  const { user, updateProfile } = useUser();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  /**
   * Enters edit mode and synchronously pre-populates form fields from the
   * current user context. Doing this in the click handler (not useEffect)
   * ensures all inputs are controlled from their very first render.
   */
  function handleEnterEditMode() {
    setFormData({
      display_name: user.display_name || '',
      age: user.age?.toString() || '',
      city: user.city || '',
      housing_status: user.housing_status || 'LOOKING',
      budget_min: user.budget_min?.toString() || '',
      budget_max: user.budget_max?.toString() || '',
      cleanliness: user.cleanliness || 'clean',
      smoking: user.smoking || 'non_smoker',
      pets: user.pets || 'no_pets',
      sleep_schedule: user.sleep_schedule || 'flexible',
      guests: user.guests || 'sometimes',
      noise_level: user.noise_level || 'moderate',
      bio: user.bio || '',
    });
    setEditMode(true);
  }

  /**
   * Updates a single field in the edit form.
   *
   * @param {string} field - Field name matching a key in formData.
   * @param {string} value - New value for that field.
   */
  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  /**
   * Submits the edited profile data via UserProvider's updateProfile.
   *
   * @param {Event} event - The form submit event.
   * @returns {Promise<void>}
   */
  async function handleSave(event) {
    event.preventDefault();
    setError('');
    setSaving(true);

    const displayName = formData.display_name.trim();
    const city = formData.city.trim();
    if (!displayName) {
      setSaving(false);
      setError('Display name cannot be blank.');
      return;
    }
    if (!city) {
      setSaving(false);
      setError('City cannot be blank.');
      return;
    }

    const age = parseInt(formData.age, 10);
    if (isNaN(age) || age < 18 || age > 100) {
      setSaving(false);
      setError('Age must be between 18 and 100.');
      return;
    }

    const budgetMin = parseInt(formData.budget_min, 10);
    const budgetMax = parseInt(formData.budget_max, 10);
    if (isNaN(budgetMin) || budgetMin < 0) {
      setSaving(false);
      setError('Minimum budget must be a non-negative number.');
      return;
    }
    if (isNaN(budgetMax) || budgetMax < 0) {
      setSaving(false);
      setError('Maximum budget must be a non-negative number.');
      return;
    }
    if (budgetMin > budgetMax) {
      setSaving(false);
      setError('Minimum budget cannot exceed maximum budget.');
      return;
    }

    const result = await updateProfile({
      ...formData,
      display_name: displayName,
      city,
      age,
      budget_min: budgetMin,
      budget_max: budgetMax,
    });

    setSaving(false);
    if (result.ok) {
      setSuccess(true);
      setEditMode(false);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Save failed. Please try again.');
    }
  }

  if (!user) return null;

  return (
    <div className="profile-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8} xl={7}>
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="profile-avatar-lg"
                  style={{ backgroundColor: user.accent_color || '#f59e0b' }}
                >
                  {user.initials || user.display_name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="page-title mb-0">{user.display_name}</h2>
                  <span className="text-muted-custom small">{user.email}</span>
                </div>
              </div>
              {!editMode && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleEnterEditMode}
                >
                  Edit profile
                </Button>
              )}
            </div>

            {success && (
              <Alert variant="success" className="mb-3">
                Profile updated successfully.
              </Alert>
            )}

            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            {/* Read mode */}
            {!editMode && (
              <>
                <Card className="mb-3">
                  <Card.Body>
                    <h6 className="profile-section-label">About</h6>
                    <Row className="g-2 mb-3">
                      <Col xs={6} md={4}>
                        <span className="profile-detail-label">Age</span>
                        <span className="profile-detail-value">{user.age}</span>
                      </Col>
                      <Col xs={6} md={4}>
                        <span className="profile-detail-label">City</span>
                        <span className="profile-detail-value">{user.city}</span>
                      </Col>
                      <Col xs={12} md={4}>
                        <span className="profile-detail-label">Situation</span>
                        <span className="profile-detail-value">
                          {label('housing_status', user.housing_status)}
                        </span>
                      </Col>
                      <Col xs={6} md={6}>
                        <span className="profile-detail-label">Budget</span>
                        <span className="profile-detail-value">
                          £{user.budget_min?.toLocaleString()} – £{user.budget_max?.toLocaleString()}/mo
                        </span>
                      </Col>
                    </Row>

                    <h6 className="profile-section-label">Lifestyle</h6>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <Badge className="profile-badge">{label('cleanliness', user.cleanliness)}</Badge>
                      <Badge className="profile-badge">{label('sleep_schedule', user.sleep_schedule)}</Badge>
                      <Badge className="profile-badge">{label('smoking', user.smoking)}</Badge>
                      <Badge className="profile-badge">{label('pets', user.pets)}</Badge>
                      <Badge className="profile-badge">{label('guests', user.guests)}</Badge>
                      <Badge className="profile-badge">{label('noise_level', user.noise_level)}</Badge>
                    </div>

                    {user.bio && (
                      <>
                        <h6 className="profile-section-label">Bio</h6>
                        <p className="profile-bio mb-0">{user.bio}</p>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}

            {/* Edit mode */}
            {editMode && (
              <Form onSubmit={handleSave}>
                <Card className="onboarding-section mb-3">
                  <Card.Body>
                    <h5 className="onboarding-section-title">About you</h5>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group controlId="editDisplayName">
                          <Form.Label>Display name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.display_name}
                            onChange={(e) => handleChange('display_name', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group controlId="editAge">
                          <Form.Label>Age</Form.Label>
                          <Form.Control
                            type="number"
                            min={18}
                            max={100}
                            value={formData.age}
                            onChange={(e) => handleChange('age', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={9}>
                        <Form.Group controlId="editCity">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.city}
                            onChange={(e) => handleChange('city', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group controlId="editHousingStatus">
                          <Form.Label>Housing situation</Form.Label>
                          <Form.Select
                            value={formData.housing_status}
                            onChange={(e) => handleChange('housing_status', e.target.value)}
                          >
                            <option value="LOOKING">I&apos;m looking for a place</option>
                            <option value="HAS_APARTMENT">I have a place and need a flatmate</option>
                            <option value="EITHER">Either works for me</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="onboarding-section mb-3">
                  <Card.Body>
                    <h5 className="onboarding-section-title">Budget</h5>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group controlId="editBudgetMin">
                          <Form.Label>Minimum (£/month)</Form.Label>
                          <Form.Control
                            type="number"
                            min={0}
                            value={formData.budget_min}
                            onChange={(e) => handleChange('budget_min', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="editBudgetMax">
                          <Form.Label>Maximum (£/month)</Form.Label>
                          <Form.Control
                            type="number"
                            min={0}
                            value={formData.budget_max}
                            onChange={(e) => handleChange('budget_max', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="onboarding-section mb-3">
                  <Card.Body>
                    <h5 className="onboarding-section-title">Lifestyle</h5>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group controlId="editCleanliness">
                          <Form.Label>Cleanliness</Form.Label>
                          <Form.Select value={formData.cleanliness} onChange={(e) => handleChange('cleanliness', e.target.value)}>
                            <option value="very_clean">Very clean (hotel standard)</option>
                            <option value="clean">Clean (tidy regularly)</option>
                            <option value="moderate">Moderate (clean when needed)</option>
                            <option value="relaxed">Relaxed (comfortable with mess)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="editSleepSchedule">
                          <Form.Label>Sleep schedule</Form.Label>
                          <Form.Select value={formData.sleep_schedule} onChange={(e) => handleChange('sleep_schedule', e.target.value)}>
                            <option value="early_bird">Early bird</option>
                            <option value="flexible">Flexible</option>
                            <option value="night_owl">Night owl</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="editSmoking">
                          <Form.Label>Smoking</Form.Label>
                          <Form.Select value={formData.smoking} onChange={(e) => handleChange('smoking', e.target.value)}>
                            <option value="non_smoker">Non-smoker</option>
                            <option value="outside_only">Smoke outside only</option>
                            <option value="smoker">Smoker</option>
                            <option value="no_preference">No preference</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="editPets">
                          <Form.Label>Pets</Form.Label>
                          <Form.Select value={formData.pets} onChange={(e) => handleChange('pets', e.target.value)}>
                            <option value="no_pets">No pets</option>
                            <option value="has_pets">I have pets</option>
                            <option value="ok_with_pets">Fine with pets</option>
                            <option value="no_preference">No preference</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="editGuests">
                          <Form.Label>Guests</Form.Label>
                          <Form.Select value={formData.guests} onChange={(e) => handleChange('guests', e.target.value)}>
                            <option value="rarely">Rarely</option>
                            <option value="sometimes">Sometimes</option>
                            <option value="often">Often</option>
                            <option value="no_preference">No preference</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="editNoiseLevel">
                          <Form.Label>Noise level</Form.Label>
                          <Form.Select value={formData.noise_level} onChange={(e) => handleChange('noise_level', e.target.value)}>
                            <option value="quiet">Quiet</option>
                            <option value="moderate">Moderate</option>
                            <option value="lively">Lively</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="onboarding-section mb-4">
                  <Card.Body>
                    <h5 className="onboarding-section-title">Bio</h5>
                    <Form.Group controlId="editBio">
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        maxLength={500}
                      />
                      <Form.Text className="text-muted-custom">
                        {(formData.bio || '').length}/500 characters
                      </Form.Text>
                    </Form.Group>
                  </Card.Body>
                </Card>

                <div className="d-flex gap-3">
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}
