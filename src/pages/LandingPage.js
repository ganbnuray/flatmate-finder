/**
 * @fileoverview LandingPage — marketing/welcome page for logged-out visitors.
 *
 * Static layout only. No API calls, no state. Designed to communicate the
 * product value proposition and direct visitors to register or log in.
 */

import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';

/**
 * Renders the public-facing landing page with hero, features, and CTAs.
 *
 * @returns {JSX.Element} The landing page.
 */
export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <p className="landing-eyebrow">A new way to find flatmates</p>
              <h1 className="landing-headline">
                Find your perfect<br />
                <span className="text-accent">flatmate.</span>
              </h1>
              <p className="landing-subheadline">
                Match based on lifestyle, not just listings. Browse real people,
                discover shared habits, and connect with someone who actually
                fits your life.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <Button
                  as={Link}
                  to="/register"
                  variant="primary"
                  size="lg"
                  className="landing-cta-primary"
                >
                  Get started — it&apos;s free
                </Button>
                <Button
                  as={Link}
                  to="/login"
                  variant="outline-secondary"
                  size="lg"
                >
                  Log in
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="landing-features">
        <Container>
          <Row className="justify-content-center mb-5">
            <Col className="text-center">
              <h2 className="landing-section-title">
                Built around how people actually live
              </h2>
            </Col>
          </Row>
          <Row className="g-4">
            <Col md={4}>
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3 className="feature-title">Smart matching</h3>
                <p className="feature-description">
                  Set your cleanliness standards, sleep schedule, and budget.
                  Browse people who share your lifestyle — not just your postcode.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3 className="feature-title">Like or pass</h3>
                <p className="feature-description">
                  A simple swipe-style feed. When two people both like each
                  other, they match — no awkward cold messages to strangers.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="feature-card">
                <div className="feature-icon">💬</div>
                <h3 className="feature-title">Chat directly</h3>
                <p className="feature-description">
                  Once matched, start a conversation. Ask the questions that
                  matter — about routines, expectations, and deal-breakers.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <section className="landing-cta-banner">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={6}>
              <h2 className="landing-cta-title">
                Ready to find your person?
              </h2>
              <p className="landing-cta-sub">
                Create a free profile in under two minutes.
              </p>
              <Button
                as={Link}
                to="/register"
                variant="primary"
                size="lg"
              >
                Create your profile
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <Container>
          <p className="text-muted-custom small text-center mb-0">
            © 2025 Flatmate Finder · Built for CS162 at Minerva University
          </p>
        </Container>
      </footer>
    </div>
  );
}
