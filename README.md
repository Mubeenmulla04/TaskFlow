# TaskFlow - Team Task Manager 🚀

TaskFlow is a production-ready, full-stack collaborative task management platform designed for modern, high-performing teams. With a sleek, dark-themed SaaS-style UI, real-time updates, and an intuitive Kanban board, TaskFlow empowers teams to organize, prioritize, and track their work efficiently.

## ✨ Features

- **Modern SaaS UI**: Glassmorphism, smooth gradients, and Framer Motion animations.
- **Kanban Board**: Drag-and-drop tasks to seamlessly manage workflows using `@hello-pangea/dnd`.
- **Real-Time Collaboration**: Instant task updates across all connected clients via Socket.io.
- **Role-Based Access Control**: Distinguish between Admin and Member roles for secure project management.
- **Interactive Dashboard**: Gain insights into team productivity with visual metrics using Recharts.
- **Activity Logs**: Keep a full history of project and task updates.
- **Responsive Design**: Flawless experience on desktop, tablet, and mobile.

## 🛠 Tech Stack

### Frontend
- React.js (Vite)
- Tailwind CSS
- React Router DOM
- Framer Motion
- Recharts
- Axios
- React Hot Toast

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT) & bcryptjs
- Socket.io
- Helmet & Rate Limiting

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB connection string (e.g., MongoDB Atlas)

### 1. Clone the repository
```bash
git clone <repository-url>
cd taskflow
```

### 2. Install dependencies
From the root directory, run the following command to install dependencies for both the frontend and backend:
```bash
npm run install-all
```

### 3. Environment Variables
Create a `.env` file in the `server` directory and add the following variables:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
```
*(Optionally, create a `.env` in the frontend directory with `VITE_API_URL=http://localhost:5000/api`)*

### 4. Run the application
Start both the backend server and the frontend React app concurrently:
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

## 🔌 API Routes

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Authenticate a user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/users` - Get all users (for team assignments)

### Projects
- `POST /api/projects` - Create a project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get a single project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project
- `POST /api/projects/:id/members` - Add a member to a project
- `DELETE /api/projects/:id/members/:userId` - Remove a member

### Tasks
- `POST /api/tasks` - Create a task
- `GET /api/tasks` - Get tasks (with filtering/search)
- `PUT /api/tasks/:id` - Update a task (status, priority, etc.)
- `DELETE /api/tasks/:id` - Delete a task
- `GET /api/tasks/stats` - Get dashboard statistics

## 🌐 Deployment (Railway)

This project is configured for seamless deployment on Railway.

1. Connect your GitHub repository to a new Railway project.
2. Add the required environment variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`) in the Railway dashboard.
3. The `railway.json` file will automatically guide the build process to start the Node.js backend.
4. **Note:** For a unified deployment, ensure the frontend is built and served from the Node backend, or deploy them as separate services on Railway.

## 📄 License
This project is licensed under the MIT License.
