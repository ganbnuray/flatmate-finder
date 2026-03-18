/**
 * @fileoverview RegisterPage — new account creation form.
 *
 * Validates that passwords match client-side before calling register()
 * from UserProvider. On success, navigates to /onboarding so the new
 * user can complete their profile before accessing the discovery feed.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
 * Renders the registration page with email, password, and confirm password fields.
 *
 * @returns {JSX.Element} The registration form page.
 */
export default function RegisterPage() {
  const { register } = useUser();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Validates the form and calls register() on success.
   *
   * Password mismatch is caught client-side before the API call.
   *
   * @param {React.FormEvent} event - The form submit event.
   * @returns {Promise<void>}
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const result = await register(email, password);

    if (result.ok) {
      navigate('/onboarding');
    } else {
      setError(result.error || 'Registration failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={6} lg={5} xl={4}>
            <div className="text-center mb-4">
              <h1 className="auth-logo">flatmate</h1>
              <p className="text-muted-custom">Create your free account</p>
            </div>

            <Card>
              <Card.Body>
                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="registerEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="registerPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="registerConfirmPassword">
                    <Form.Label>Confirm password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100"
                    disabled={loading}
                  >
                    {loading ? 'Creating account…' : 'Create account'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            <p className="text-center mt-3 text-muted-custom small">
              Already have an account?{' '}
              <Link to="/login">Log in</Link>
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
