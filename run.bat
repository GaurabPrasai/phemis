@echo off
echo Starting Django Backend and React Frontend...

:: Start Django Backend
cd backend
if exist venv (
    echo Using existing virtual environment...
) else (
    echo Creating new virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
start cmd /k "venv\Scripts\activate && python manage.py runserver"

:: Start React Frontend
cd ../frontend
echo Installing frontend dependencies...
call npm install
start cmd /k "npm start"

echo Servers are starting... Please wait...
echo Backend will be available at http://localhost:8000
echo Frontend will be available at http://localhost:3000
echo.
echo Note: Please wait for both servers to fully start before using the application. 