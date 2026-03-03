# AgroConnect Cameroon 🇨🇲

<div align="center">
  <h1 align="center">AgroConnect</h1>
  <p align="center">
    <strong>Empowering Cameroonian Agriculture, One Connection at a Time.</strong>
    <br />
    A comprehensive application connecting farmers, buyers, and service providers to digitize and strengthen Cameroon's agricultural supply chain.
    <br />
    <em>Created by EFUELATEH GEORGE</em>
  </p>
</div>

---

## 📌 1. Project Overview

AgroConnect is a full-stack web application designed to bridge the gap between rural farmers and urban markets in Cameroon. It addresses critical challenges like market access, post-harvest losses, and price transparency by providing a centralized, trusted, and easy-to-use digital marketplace.

This project includes:
1.  A **React Frontend** located under the `src/` directory at the project root.
2.  A **Node.js Backend** located in the `backend` directory.

---

## 🛠️ 2. Technologies Used

*   **Frontend (root `src/`):**
    *   React, TypeScript, Vite, Tailwind CSS, React Router.
*   **Backend (`/backend`):**
    *   Node.js & Express.js
    *   TypeScript
    *   MongoDB & Mongoose
    *   JWT & bcryptjs for authentication.
    *   `dotenv` for environment variables.

---

## 🚀 3. How to Run the Full Application Locally

To run the full-stack application, you will need **Node.js** and **MongoDB** installed on your system. You will need **two separate terminals** running at the same time.

### Terminal 1: Start the Backend Server

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    *   Create a file named `.env` in the `backend` directory.
    *   Add the following variables, replacing the placeholder values:
        ```
        NODE_ENV=development
        PORT=5000
        MONGO_URI=mongodb://localhost:27017/agroconnect
        JWT_SECRET=your_super_secret_jwt_key
        ```

4.  **Start the backend server:**
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:5000`. Leave this terminal running.

### Terminal 2: Start the Frontend Development Server

1.  **Open a new terminal and navigate to the project root (frontend code resides in `src`):**
    ```bash
    cd /path/to/agroconnect
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Start the frontend server:**
    ```bash
    npm run dev
    ```
    The Vite development server will start, typically on `http://localhost:5173`.

### Step 3: Access the Application

Open your browser and navigate to the URL provided by the frontend server (usually `http://localhost:5173`). The `vite.config.ts` is already configured to proxy API requests from `/api` to your backend server running on port 5000.

---

## 🏗️ 6. Building & Previewing Production Assets

To generate production-ready bundles and preview them locally:

**Frontend**
```bash
# from project root
npm install             # if not already installed
npm run build           # create optimized `dist/` directory
npm run preview -- --port 5173   # serve the build on port 5173
```

**Backend**
```bash
cd backend
npm install             # ensure dependencies are present
npm run build           # compile TypeScript to `dist/`
# copy a `.env` from .env.example and fill values
npm start               # starts the compiled server (port controlled by PORT env)
```

The backend exposes a simple root route (`GET /`) so you can hit the URL directly without getting a 404.

Regardless of environment, you can still hit `/api` to confirm the API is running.


---

## 👥 4. User Roles

AgroConnect features a sophisticated role-based access control system to provide tailored experiences for every user.

| Role                  | Description                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| 👤 **Admin**          | Oversees the entire platform, manages users, approves listings, resolves escalated disputes, and views analytics. |
| 🛒 **Buyer**          | Purchases produce, books services, leaves reviews, and communicates with sellers.                       |
| 🧑‍🌾 **Farmer**        | Lists agricultural produce, manages inventory, tracks orders, and manages finances.                     |
| 🔧 **Service Provider** | Lists agricultural services (e.g., tractor rental, soil testing) and manages bookings.                  |
| 🎧 **Support Agent**  | Assists users with inquiries and helps mediate disputes within the platform's resolution center.         |

---

## 📄 5. License

This project is licensed under the **MIT License**.
