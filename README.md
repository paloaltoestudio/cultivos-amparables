# Cultivos Amparables

A React + Vite web application with authentication and protected routes.

## Features

- 🔐 Login page with email/password authentication
- 🛡️ Protected dashboard route
- 📦 Zustand for state management
- 🔒 Secure token storage using localStorage (via Zustand persist)
- 🎨 Modern, responsive UI

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Zustand** - State management
- **Tailwind CSS** - Utility-first CSS framework

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   └── ProtectedRoute.jsx    # Route protection wrapper
├── pages/
│   ├── Login.jsx              # Login page
│   └── Dashboard.jsx          # Protected dashboard page
├── services/
│   └── authService.js         # Authentication API service
├── store/
│   └── authStore.js           # Zustand auth store
├── App.jsx                     # Main app component with routing
├── App.css                     # Tailwind CSS directives
└── main.jsx                    # Entry point
```

## Authentication

The app uses the authentication endpoint:
- **Base URL**: `https://visor.inn.com.co:8006`
- **Login Endpoint**: `/auth/login`
- **Request Body**: `{ "mail": "email", "contrasena": "password" }`

The authentication token is securely stored in localStorage using Zustand's persist middleware and is automatically included in API requests via the `authService.getAuthHeaders()` helper.

## Usage

1. Navigate to the login page
2. Enter your email and password
3. Upon successful login, you'll be redirected to the dashboard
4. The dashboard is protected - unauthenticated users will be redirected to login
5. Use the logout button to sign out

