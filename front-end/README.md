# Frontend Setup and Usage Guide

## Overview
This document provides instructions for setting up and running the frontend portion of the property management web application. The frontend is built with React, Vite, and Tailwind CSS.

## Prerequisites
- Node.js (v18 or higher recommended)
- PNPM (v9.12.0 or higher)
- Backend API server running (typically on port 8000)

## Setup Instructions

### 1. Clone the Repository
If you haven't already, clone the repository and navigate to the frontend directory:
```bash
git clone <repository-url>
cd Web_App_v1/front-end
```

### 2. Install Dependencies
This project uses PNPM as the package manager. Install dependencies with:
```bash
pnpm install
```

If you don't have PNPM installed, you can install it using:
```bash
npm install -g pnpm
```

### 3. Environment Configuration
The application uses environment variables for configuration. A sample `.env` file is included:

```
VITE_API_HOST=http://127.0.0.1:8000
VITE_SOCKET_HOST=http://127.0.0.1:8000
VITE_ENCRYPT_KEY="*************************"
```

Modify these values if your backend is running on a different URL or if you need a different encryption key.

### 4. Running the Development Server
Start the development server with:
```bash
pnpm dev
```

This will start the Vite development server, typically on port 5173. You can access the application at `http://localhost:5173`.

### 5. Building for Production
To build the application for production:
```bash
pnpm build
```

This creates optimized production files in the `dist` directory.

To preview the production build locally:
```bash
pnpm preview
```

## Development Notes

### Key Files and Directories

- `src/` - Main source directory
  - `api/` - API communication layer
  - `components/` - UI components
  - `hooks/` - Custom React hooks
  - `store/` - Redux state management
  - `helpers/` - Utility functions
  - `pages/` - Page components
