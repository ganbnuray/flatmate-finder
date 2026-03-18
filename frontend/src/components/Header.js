/**
 * @fileoverview Header navigation component.
 *
 * Layout component that reads global user state to conditionally render
 * authenticated vs. unauthenticated navigation. This is one of three
 * components permitted to call useUser() directly (along with PrivateRoute
 * and PublicRoute) because it requires global auth state to function.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useUser } from '../contexts/UserProvider';

/**
 * Renders the top navigation bar with links appropriate to auth state.
 *
 * When authenticated: shows Discovery, Matches, Messages, Profile links
 * and a Logout button.
 * When unauthenticated: shows Login and Register buttons only.
 *
 * @returns {JSX.Element} A Bootstrap sticky-top Navbar.
 */
export default function Header() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  /**
   * Handles the logout button click — calls logout() then redirects home.
   *
   * @returns {Promise<void>}
   */
  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <Navbar sticky="top" expand="md" className="px-0">
      <Container fluid="lg">
        <Navbar.Brand as={NavLink} to={user ? '/discovery' : '/'}>
          flatmate
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          {user ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={NavLink} to="/discovery">
                  Discover
                </Nav.Link>
                <Nav.Link as={NavLink} to="/matches">
                  Matches
                </Nav.Link>
                <Nav.Link as={NavLink} to="/messages">
                  Messages
                </Nav.Link>
                <Nav.Link as={NavLink} to="/profile">
                  Profile
                </Nav.Link>
              </Nav>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleLogout}
              >
                Log out
              </Button>
            </>
          ) : (
            <Nav className="ms-auto gap-2">
              <Nav.Link as={NavLink} to="/login">
                Log in
              </Nav.Link>
              <Button
                as={NavLink}
                to="/register"
                variant="primary"
                size="sm"
              >
                Sign up
              </Button>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
