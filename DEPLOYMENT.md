# Deployment Guide

This guide covers how to deploy the Cybersecurity Threat Detection System.

## Prerequisites
- **GitHub Account**: To host the code repository.
- **Render Account**: To host the Python backend (free tier available).
- **Vercel Account**: To host the React frontend (free tier available).
- **MongoDB Atlas Account**: For the database.

## 1. Backend Deployment (Render)

1.  **Push Code to GitHub**: Ensure your project is pushed to a GitHub repository.
2.  **Create New Web Service on Render**:
    -   Go to [dashboard.render.com](https://dashboard.render.com/).
    -   Click **New +** -> **Web Service**.
    -   Connect your GitHub repository.
3.  **Configure Service**:
    -   **Name**: `cybersecurity-backend` (or similar)
    -   **Root Directory**: `.` (leave empty or dot)
    -   **Runtime**: `Python 3`
    -   **Build Command**: `pip install -r requirements.txt`
    -   **Start Command**: `gunicorn --worker-class eventlet -w 1 server:app`
4.  **Environment Variables**:
    -   Add `MONGO_URI`: Your MongoDB connection string (e.g., `mongodb+srv://...`).
    -   Add `PYTHON_VERSION`: `3.10.0` (optional, but recommended).
5.  **Deploy**: Click **Create Web Service**.
6.  **Copy URL**: Once deployed, copy the service URL (e.g., `https://cybersecurity-backend.onrender.com`).

## 2. Frontend Deployment (Vercel)

1.  **Import Project in Vercel**:
    -   Go to [vercel.com](https://vercel.com/).
    -   Click **Add New...** -> **Project**.
    -   Import the same GitHub repository.
2.  **Configure Project**:
    -   **Framework Preset**: Vite
    -   **Root Directory**: `frontend` (Important! Click "Edit" next to Root Directory and select the `frontend` folder).
3.  **Environment Variables**:
    -   Add `VITE_API_URL`: Paste the Render backend URL you copied earlier (e.g., `https://cybersecurity-backend.onrender.com`).
        -   *Note: Do not add a trailing slash.*
4.  **Deploy**: Click **Deploy**.

## 3. Final Verification

1.  Open your deployed Vercel URL.
2.  Check the "System Status" indicator in the Dashboard. It should show "SYSTEM ONLINE" (green).
3.  Try the "Login Demo" to ensure it connects to the backend and logs threats to your MongoDB.

## Troubleshooting

-   **Backend Errors**: Check the "Logs" tab in Render. Common issues include missing dependencies in `requirements.txt` or incorrect `MONGO_URI`.
-   **Frontend Connection**: If the system status is "DISCONNECTED", check the browser console (F12). Ensure `VITE_API_URL` is set correctly in Vercel and that the backend is running (Render free tier spins down after inactivity, so the first request might take 50 seconds).
