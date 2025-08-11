# StreamX - Ultimate Movie Streaming Platform

Welcome to **StreamX**, a modern, full-stack movie streaming platform designed to bring the cinema experience right to your screen. This project is built with the MERN stack (MongoDB, Express, React, Node.js) and powered by Vite for a blazing-fast development environment.

The foundation of StreamX is a robust and secure user authentication system, ensuring a safe and personalized experience for every user.

-----

## ✨ Features

### Current Features (Authentication Core)

  * **Secure User Accounts**: A complete authentication flow for user signup, login, and logout.
  * **JWT-Based Sessions**: Utilizes JSON Web Tokens for stateless, secure, and persistent user sessions (up to 30 days).
  * **One-Click Google Login**: Offers seamless social login and signup with Google OAuth 2.0.
  * **Enhanced Security**:
      * Passwords are encrypted using industry-standard `bcrypt`.
      * Sends beautifully themed **email security alerts** on every new login, detailing the time, IP address, and estimated location.
  * **Sleek & Responsive UI**: A modern, dark-themed, and fully responsive authentication interface built with React and animated with Framer Motion.
  * **Instant Feedback**: Provides immediate user feedback with custom-themed toast notifications for success and error states, managed by `react-hot-toast`.
  * **Centralized State Management**: Employs Zustand for a clean, simple, and predictable state management solution.

### Upcoming Features (The Streaming Experience)

  * Browse an extensive library of movies and TV shows.
  * Search and filter content by genre, rating, and year.
  * High-quality video streaming.
  * Personalized watchlists and user profiles.
  * And much more\!

-----

## 🛠️ Tech Stack

  * **Frontend**: React, Vite, Zustand, Axios, Framer Motion, React Hot Toast
  * **Backend**: Node.js, Express, Mongoose
  * **Database**: MongoDB
  * **Authentication**: JWT, Google OAuth 2.0, Bcrypt
  * **Email**: Nodemailer with Gmail

-----

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing.

### Prerequisites

  * **Node.js**: Version 18.x or higher.
  * **MongoDB**: A MongoDB Atlas account or a local MongoDB instance.
  * **Google Cloud Platform Account**: To set up Google OAuth 2.0 credentials.
  * **Gmail Account**: With an "App Password" enabled for sending email notifications.

### Installation & Setup

**1. Clone the repository:**

```bash
git clone https://github.com/your-username/streamx.git
cd streamx
```

**2. Install dependencies:**
This command installs all necessary packages for both the frontend and backend.

```bash
npm install
```

**3. Set up environment variables:**
Create a `.env` file in the root directory of the project. This file will store all your secret keys and credentials.

#### `.env` file Template

```env
# Google OAuth Client ID (from Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# MongoDB Connection String (from MongoDB Atlas)
MONGODB_URI=your_mongodb_connection_string

# JWT Secret Key (generate a strong, 64-character random string)
JWT_SECRET=your_super_strong_jwt_secret

# Nodemailer/Gmail Credentials
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_16_character_google_app_password
```

**4. Configure Google OAuth Credentials:**

  * Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
  * Create or select a project.
  * Navigate to "Credentials", click "+ CREATE CREDENTIALS", and select "OAuth client ID".
  * Choose "Web application" as the type.
  * Under **"Authorised JavaScript origins"**, add your frontend's development URL: `http://localhost:5173`.
  * Copy the generated **Client ID** and paste it into the `VITE_GOOGLE_CLIENT_ID` field in your `.env` file.

**5. Run the application:**
This command uses `concurrently` to launch both the backend Express server and the frontend Vite development server simultaneously.

```bash
npm run dev
```

  * Your React application will be available at **`http://localhost:5173`**.
  * Your Node.js backend API will be running on **`http://localhost:3000`**.