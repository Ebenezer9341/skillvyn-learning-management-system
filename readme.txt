# Skillvyn - Learning Management System

Skillvyn is a comprehensive MERN-stack platform for skill acquisition and course management. It features a robust coupon system, secure enrollment processes, and an intuitive dashboard for mentors and students.

## 🚀 Setup & Execution Instructions

### 1. Prerequisites
- **Node.js**: (v18+ recommended)
- **MongoDB**: Ensure a local instance is running (`mongodb://localhost:27017/`) or use a remote Atlas URI.

### 2. Environment Variables Configuration
The project uses specific naming conventions for `.env` keys.

#### Backend (`/backend/.env`)
Create a `.env` file with these exact keys:
- `MONGO_URL`: MongoDB connection string.
- `PORT`: Server port (currently set to `8080`).
- `JWT_SECRET_KEY`: Primary JWT secret.
- `REFRESH_SECRET_KEY`: Refresh token secret.
- `ALLOWED_ORIGINS`: CORS whitelist (commonly `http://localhost:5173`).
- `DEBUG_MODE`: Set to `True` for detailed logs.
- `PAYMENT_WEBHOOK_SECRET`: Secure string for Stripe/Paddle webhooks.
- `SUPERUSER_EMAIL`: Default admin email for seeding.
- `SUPERUSER_PASSWORD`: Default admin password for seeding.
- `EMAIL_HOST`: SMTP host (e.g., `smtp.gmail.com`).
- `EMAIL_PORT`: SMTP port (e.g., `587`).
- `EMAIL_USER`: Your email for sending auth codes.
- `EMAIL_PASS`: App-specific password for your email provider.
- `EMAIL_FROM`: The sender address users will see.
- `FRONTEND_URL`: URL of the React app (used for email links).

#### Frontend (`/frontend/.env`)
Create a `.env` file with these exact keys:
- `VITE_API_BASE_URL`: The backend server's API endpoint (e.g., `http://localhost:8080`).

---

### 3. Backend Setup
```bash
cd backend
npm install
npm run dev
```
*The server will start on port 8080.*

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The application will be accessible at http://localhost:5173.*

---

## 🛠️ Key Commands Summary
| Command | Directory | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | /backend | Starts the API server with auto-reload. |
| `npm run dev` | /frontend | Starts the Vite development server. |
| `npm run seed:superuser` | /backend | (Optional) Seeds a superuser account for testing. |
| `npm run build` | /frontend | Generates the production build. |

## 📐 Recent Hardening
The project has undergone multiple high-priority security audits:
- **Transactional Atomicity**: All business logic (enrollments, payments, increments) is wrapped in Mongoose sessions for data integrity.
- **Defensive Coding**: Protection against divide-by-zero errors in quizzes and ratings.
- **Null Checks**: Hardened webhook and profile controllers to prevent runtime crashes.
