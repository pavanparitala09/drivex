# DriveX - Google Drive Clone

A full-stack file management platform inspired by Google Drive, built using the MERN stack (MongoDB, Express, React, Node.js). It provides a secure, fast, and intuitive interface for storing and managing your personal files in the cloud.

## 🚀 Features

- **Authentication & Security:** Secure user registration and login using JSON Web Tokens (JWT).
- **File Management:** Upload files of any type (up to 500MB). Files are securely hosted via Cloudinary.
- **Folder Navigation:** Create nested folders, move files, and navigate seamlessly through breadcrumbs.
- **Trash & Soft Deletion:** Accidentally deleted a file? It goes to the Trash bin where it can be restored.
- **Automated Cleanup:** A backend cron job automatically purges files from the Trash after 15 days to free up space.
- **Starred Items:** Quick access to your most important files and folders.
- **File Sharing:** Share files with other registered users, assigning them 'view' or 'edit' permissions.
- **Storage Quotas:** Real-time tracking of storage used against the user's 500MB limit.

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- Redux Toolkit (State Management)
- Tailwind CSS (Styling)
- Axios (API Requests)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (Database & ORM)
- Cloudinary & Multer (File Upload & Cloud Storage)
- node-cron (Scheduled Tasks)
- JSON Web Tokens (Auth)

## ⚙️ Local Development Setup

### Prerequisites
- Node.js (v16+)
- MongoDB connection string (Atlas or Local)
- Cloudinary Account (for file hosting)

### 1. Clone the repository
```bash
git clone https://github.com/pavanparitala09/driveX.git
cd DriveX
```

### 2. Backend Setup
Navigate into the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window, navigate to the client directory, and install dependencies:
```bash
cd client
npm install
```

Create a `.env` file in the `client` directory (if needed):
```env
VITE_API_URL=http://localhost:5000/api
```

Start the React development server:
```bash
npm run dev
```

### 4. Access the App
Open your browser and navigate to `http://localhost:3000` (or the port Vite provides).

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
