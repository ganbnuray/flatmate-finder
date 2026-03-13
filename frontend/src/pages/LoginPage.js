/**
 * @fileoverview LoginPage — email and password login form.
 *
 * Calls login() from UserProvider on submit. On success, React Router's
 * PublicRoute automatically redirects the now-authenticated user to
 * /discovery. On failure, an inline error message is displayed.
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
 * Renders the login page with an email/password form.
 *
 * @returns {JSX.Element} The login form page.
 */
export default function LoginPage() {
  const { login } = useUser();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handles form submission — calls login() and navigates on success.
   *
   * @param {React.FormEvent} event - The form submit event.
   * @returns {Promise<void>}
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.ok) {
      navigate('/discovery');
    } else {
      setError(result.error || 'Login failed. Please try again.');
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
              <p className="text-muted-custom">Welcome back</p>
            </div>

            <Card>
              <Card.Body>
                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="loginEmail">
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

                  <Form.Group className="mb-4" controlId="loginPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100"
                    disabled={loading}
                  >
                    {loading ? 'Logging in…' : 'Log in'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            <p className="text-center mt-3 text-muted-custom small">
              Don&apos;t have an account?{' '}
              <Link to="/register">Sign up</Link>
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
