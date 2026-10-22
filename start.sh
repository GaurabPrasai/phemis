#!/usr/bin/env bash

echo "Starting Django Backend and React Frontend..."

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# -----------------------------------------------
# Backend (Django)
# -----------------------------------------------
cd "$ROOT_DIR/backend"

# Detect venv layout: Windows venvs use venv/Scripts, POSIX venvs use venv/bin
if [ -f "venv/Scripts/python.exe" ]; then
    VENV_PY="venv/Scripts/python.exe"
    echo "Using existing virtual environment (Windows layout)..."
elif [ -f "venv/bin/python" ]; then
    VENV_PY="venv/bin/python"
    echo "Using existing virtual environment..."
else
    echo "Creating new virtual environment..."
    python3 -m venv venv 2>/dev/null || python -m venv venv
    if [ -f "venv/Scripts/python.exe" ]; then
        VENV_PY="venv/Scripts/python.exe"
    else
        VENV_PY="venv/bin/python"
    fi
fi

# Install dependencies only if any are missing (avoids pip on every start)
if ! "$VENV_PY" -c "import django, decouple, rest_framework, corsheaders, pandas, requests" 2>/dev/null; then
    echo "Installing backend dependencies (first run only)..."
    "$VENV_PY" -m pip install --disable-pip-version-check -q -r requirements.txt
fi

# Reuse a server already listening on port 8000 (best effort)
if command -v curl >/dev/null 2>&1 && curl -s -o /dev/null --max-time 1 http://127.0.0.1:8000/api/health/; then
    echo "Port 8000 already in use - reusing the running server."
    DJANGO_PID="reuse"
else
    echo "Starting Django server..."
    nohup "$VENV_PY" manage.py runserver 0.0.0.0:8000 > ../django.log 2>&1 &
    DJANGO_PID=$!
fi

# Wait until the API actually answers (model files load at first import)
echo "Waiting for backend to become ready..."
BACKEND_READY=0
for _ in $(seq 1 60); do
    if curl -s -o /dev/null --max-time 5 "http://127.0.0.1:8000/api/health/"; then
        BACKEND_READY=1
        break
    fi
    # Bail out early if the process died
    if [ "$DJANGO_PID" != "reuse" ] && ! kill -0 "$DJANGO_PID" 2>/dev/null; then
        break
    fi
    sleep 1
done

if [ "$BACKEND_READY" = "1" ]; then
    echo "Backend is ready: http://localhost:8000"
else
    echo "Backend FAILED to start - see django.log:"
    tail -20 ../django.log
fi

# -----------------------------------------------
# Frontend (React)
# -----------------------------------------------
cd "$ROOT_DIR/frontend"

if [ -d "node_modules" ]; then
    echo "Using existing node_modules..."
else
    echo "Installing frontend dependencies..."
    npm install
fi

if command -v curl >/dev/null 2>&1 && curl -s -o /dev/null --max-time 1 http://127.0.0.1:3000/; then
    echo "Port 3000 already in use - reusing the running server."
    REACT_PID="reuse"
else
    echo "Starting React development server..."
    nohup npm start > ../react.log 2>&1 &
    REACT_PID=$!
fi

cd "$ROOT_DIR"

echo ""
echo "========================================"
if [ "$BACKEND_READY" = "1" ]; then
    echo "Servers started successfully!"
else
    echo "Frontend started; BACKEND FAILED (see django.log)"
fi
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "========================================"
echo ""
echo "Django PID: $DJANGO_PID (logs: django.log)"
echo "React PID: $REACT_PID (logs: react.log)"
echo ""
if [ "$DJANGO_PID" != "reuse" ] && [ "$REACT_PID" != "reuse" ]; then
    echo "To stop servers, run: kill $DJANGO_PID $REACT_PID"
fi
