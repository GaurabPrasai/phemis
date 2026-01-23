#!/bin/bash

echo "Starting Django Backend and React Frontend..."

# Start Django Backend
cd backend

if [ -d "venv" ]; then
    echo "Using existing virtual environment..."
else
    echo "Creating new virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

echo "Starting Django server..."
nohup python manage.py runserver > ../django.log 2>&1 &
DJANGO_PID=$!

# Start React Frontend
cd ../frontend

if [ -d "node_modules" ]; then
    echo "Using existing node_modules..."
else
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting React development server..."
nohup npm start > ../react.log 2>&1 &
REACT_PID=$!

cd ..

echo ""
echo "========================================"
echo "Servers started successfully!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "========================================"
echo ""
echo "Django PID: $DJANGO_PID (logs: django.log)"
echo "React PID: $REACT_PID (logs: react.log)"
echo ""
echo "To stop servers, run: kill $DJANGO_PID $REACT_PID"