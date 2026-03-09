/**
 * @fileoverview OnboardingPage — profile creation form shown immediately
 * after registration.
 *
 * All field names and enum values match db/schema.sql exactly so that when
 * the real backend is connected, the submitted data is already in the
 * correct format with no transformation needed.
 *
 * Uses updateProfile() from UserProvider (not useApi() directly) so that
 * the shared user state and localStorage are updated atomically.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from 'react-bootstrap';
import { useUser } from '../contexts/UserProvider';

/**
 * Renders the multi-section profile creation onboarding form.
 *
 * Sections: About You → Budget → Lifestyle → Bio.
 * Submission calls updateProfile() and navigates to /discovery on success.
 *
 * @returns {JSX.Element} The onboarding form page.
 */
export default function OnboardingPage() {
  const { updateProfile } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    display_name: '',
    age: '',
    city: '',
    housing_status: 'LOOKING',
    budget_min: '',
    budget_max: '',
    cleanliness: 'clean',
    smoking: 'non_smoker',
    pets: 'no_pets',
    sleep_schedule: 'flexible',
    guests: 'sometimes',
    noise_level: 'moderate',
    bio: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  /**
   * Updates a single field in the form data state.
   *
   * @param {string} field - The form field name (must be a key of formData).
   * @param {string} value - The new value for that field.
   */
  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  /**
   * Validates required fields and submits the profile data.
   *
   * @param {React.FormEvent} event - The form submit event.
   * @returns {Promise<void>}
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const age = parseInt(formData.age, 10);
    if (isNaN(age) || age < 18 || age > 100) {
      setError('Age must be between 18 and 100.');
      return;
    }

    const budgetMin = parseInt(formData.budget_min, 10);
    const budgetMax = parseInt(formData.budget_max, 10);
    if (isNaN(budgetMin) || isNaN(budgetMax) || budgetMin > budgetMax) {
      setError('Minimum budget cannot exceed maximum budget.');
      return;
    }

    setSaving(true);
    const result = await updateProfile({
      ...formData,
      age,
      budget_min: budgetMin,
      budget_max: budgetMax,
    });

    if (result.ok) {
      navigate('/discovery');
    } else {
      setError(result.error || 'Failed to save profile. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="onboarding-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8} xl={7}>
            <div className="mb-4">
              <h2 className="onboarding-title">Set up your profile</h2>
              <p className="text-muted-custom">
                This helps us find flatmates who actually match your lifestyle.
              </p>
            </div>

            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              {/* ── Section: About You ──────────────────────────── */}
              <Card className="onboarding-section mb-4">
                <Card.Body>
                  <h5 className="onboarding-section-title">About you</h5>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="displayName">
                        <Form.Label>Display name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="How you'll appear to others"
                          value={formData.display_name}
                          onChange={(e) => handleChange('display_name', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group controlId="age">
                        <Form.Label>Age</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="18+"
                          min={18}
                          max={100}
                          value={formData.age}
                          onChange={(e) => handleChange('age', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={9}>
                      <Form.Group controlId="city">
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. London, Manchester"
                          value={formData.city}
                          onChange={(e) => handleChange('city', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group controlId="housingStatus">
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

              {/* ── Section: Budget ─────────────────────────────── */}
              <Card className="onboarding-section mb-4">
                <Card.Body>
                  <h5 className="onboarding-section-title">Budget</h5>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="budgetMin">
                        <Form.Label>Minimum (£/month)</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="e.g. 800"
                          min={0}
                          value={formData.budget_min}
                          onChange={(e) => handleChange('budget_min', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="budgetMax">
                        <Form.Label>Maximum (£/month)</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="e.g. 1400"
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

              {/* ── Section: Lifestyle ──────────────────────────── */}
              <Card className="onboarding-section mb-4">
                <Card.Body>
                  <h5 className="onboarding-section-title">Lifestyle</h5>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="cleanliness">
                        <Form.Label>Cleanliness</Form.Label>
                        <Form.Select
                          value={formData.cleanliness}
                          onChange={(e) => handleChange('cleanliness', e.target.value)}
                        >
                          <option value="very_clean">Very clean (hotel standard)</option>
                          <option value="clean">Clean (tidy regularly)</option>
                          <option value="moderate">Moderate (clean when needed)</option>
                          <option value="relaxed">Relaxed (comfortable with mess)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="sleepSchedule">
                        <Form.Label>Sleep schedule</Form.Label>
                        <Form.Select
                          value={formData.sleep_schedule}
                          onChange={(e) => handleChange('sleep_schedule', e.target.value)}
                        >
                          <option value="early_bird">Early bird (up before 7am)</option>
                          <option value="flexible">Flexible (varies by day)</option>
                          <option value="night_owl">Night owl (up past midnight)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="smoking">
                        <Form.Label>Smoking</Form.Label>
                        <Form.Select
                          value={formData.smoking}
                          onChange={(e) => handleChange('smoking', e.target.value)}
                        >
                          <option value="non_smoker">Non-smoker</option>
                          <option value="outside_only">Smoke outside only</option>
                          <option value="smoker">Smoker</option>
                          <option value="no_preference">No preference</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="pets">
                        <Form.Label>Pets</Form.Label>
                        <Form.Select
                          value={formData.pets}
                          onChange={(e) => handleChange('pets', e.target.value)}
                        >
                          <option value="no_pets">No pets</option>
                          <option value="has_pets">I have pets</option>
                          <option value="ok_with_pets">Fine with pets</option>
                          <option value="no_preference">No preference</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="guests">
                        <Form.Label>Guests</Form.Label>
                        <Form.Select
                          value={formData.guests}
                          onChange={(e) => handleChange('guests', e.target.value)}
                        >
                          <option value="rarely">Rarely have guests</option>
                          <option value="sometimes">Occasionally</option>
                          <option value="often">Often — social household</option>
                          <option value="no_preference">No preference</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="noiseLevel">
                        <Form.Label>Noise level</Form.Label>
                        <Form.Select
                          value={formData.noise_level}
                          onChange={(e) => handleChange('noise_level', e.target.value)}
                        >
                          <option value="quiet">Quiet household</option>
                          <option value="moderate">Moderate — normal conversations</option>
                          <option value="lively">Lively — music, gatherings</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* ── Section: Bio ────────────────────────────────── */}
              <Card className="onboarding-section mb-4">
                <Card.Body>
                  <h5 className="onboarding-section-title">Short bio</h5>
                  <Form.Group controlId="bio">
                    <Form.Label>Tell potential flatmates about yourself</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="What should a potential flatmate know about you? Your routine, your interests, what you're looking for…"
                      value={formData.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      maxLength={500}
                    />
                    <Form.Text className="text-muted-custom">
                      {formData.bio.length}/500 characters
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-100"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Complete profile and start exploring →'}
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
