# AgroConnect Backend

This directory contains the complete backend scaffold for the AgroConnect application, built with Node.js, Express, and MongoDB (using Mongoose).

## PLEASE READ: This is a Scaffold

This backend code is a complete **blueprint** provided to you. It is fully structured and contains all the necessary logic and schemas. However, to run it, you must follow the setup steps below. It is not "plug-and-play" from the browser environment it was generated in.

## Prerequisites

*   **Node.js:** Make sure you have Node.js installed on your machine.
*   **MongoDB:** You need a running MongoDB instance, either locally or through a cloud service like MongoDB Atlas.

## Setup Instructions

1.  **Install Dependencies:**
    Navigate to this `backend` directory in your terminal and run:
    ```bash
    npm install
    ```

2.  **Create Environment File:**
    Create a file named `.env` in this directory. This file will store your secret keys and database connection string. Copy the following content into it:

    ```
    NODE_ENV=development
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_jwt_key
    ```

    *   Replace `your_mongodb_connection_string` with your actual MongoDB connection URI (e.g., `mongodb://localhost:27017/agroconnect`).
    *   Replace `your_super_secret_jwt_key` with a long, random string for signing your authentication tokens.

3.  **Run the Server:**
    To run the server in development mode (with auto-restarting on file changes), use:
    ```bash
    npm run dev
    ```
    The server should start and you'll see a message like `Server running on port 5000` and `MongoDB Connected`.

## API Structure

The API follows a standard RESTful pattern:

*   **Models (`/src/models`):** Define the data structure using Mongoose schemas.
*   **Routes (`/src/routes`):** Define the API endpoints (e.g., `/api/users`, `/api/listings`).
*   **Controllers (`/src/controllers`):** Contain the business logic for each route.
*   **Middleware (`/src/middleware`):** Includes functions for authentication (`authMiddleware`) and error handling.
## Testimonials

A public endpoint (GET /api/public/testimonials) returns community testimonials. The server automatically seeds a few example entries when the collection is empty. Authenticated users can submit new testimonials via POST /api/public/testimonials (use a bearer token).
