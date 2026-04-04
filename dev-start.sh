#!/usr/bin/env bash
# Starts the Flatmate Finder frontend and backend for local development.
# Usage: ./dev-start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env from project root if it exists
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Validate required env vars
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo ""
  echo "  1. Copy .env.example to .env:"
  echo "     cp .env.example .env"
  echo ""
  echo "  2. Fill in your Supabase (or local PostgreSQL) connection string."
  echo ""
  exit 1
fi

echo "Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q
cd ..

echo "Starting backend on http://localhost:5050 ..."
cd backend
python app.py &
BACKEND_PID=$!
cd ..

echo "Starting frontend on http://localhost:3000 ..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "Flatmate Finder is running:"
echo "  Frontend → http://localhost:3000"
echo "  Backend  → http://localhost:5050"
echo ""
echo "Press Ctrl+C to stop both servers."

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

trap cleanup INT TERM
wait
