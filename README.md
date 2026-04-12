# Flatmate Finder

A web app that helps students and young professionals find compatible flatmates based on lifestyle preferences, budget, and living habits.

## Problem Statement

Students and young professionals often struggle to find compatible flatmates through existing channels such as Facebook groups or generic housing platforms. These spaces are fragmented, hard to filter, and focus mostly on the room rather than the person — leading to mismatched lifestyles, wasted time, and uncomfortable living situations.

Flatmate Finder is a structured, profile-driven platform that helps users quickly identify and connect with potential flatmates based on compatibility factors like budget, habits, and preferences.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Create React App) |
| Styling | Bootstrap 5 + custom CSS |
| Backend | Flask (Python) |
| Database | PostgreSQL |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A PostgreSQL database (Supabase or local)

### Installation

```bash
git clone https://github.com/ganbnuray/flatmate-finder.git
cd flatmate-finder
```

Copy `.env.example` to `.env` and fill in your `DATABASE_URL`:

```bash
cp .env.example .env
```

### Running

```bash
./dev-start.sh
```

The script installs dependencies, then starts the backend and frontend. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running Tests

Tests require Docker to be running. They use [testcontainers](https://testcontainers-python.readthedocs.io/) to spin up a disposable PostgreSQL database, so they never touch the production database.

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

## Development Workflow

This project follows **GitHub Flow**. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before making any changes.

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<short-description>` | `feature/user-profile-page` |
| Bug fix | `fix/<short-description>` | `fix/login-redirect` |
| Setup/config | `setup/<short-description>` | `setup/ci-pipeline` |
| Documentation | `docs/<short-description>` | `docs/api-endpoints` |

## Team

| Member | Role |
|--------|------|
| Nuray | BE/DB |
| Ahmed | BE/DB |
| Karolina | FE+UI/UX |
| James | FE+UI/UX |
| Aru | FE+UI/UX |
| Dasha | PM |

## License

This project is developed as part of the CS162 course at Minerva University.
