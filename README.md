# DriveX - Google Drive Clone

A full-stack file management platform inspired by Google Drive, built using the MERN stack (MongoDB, Express, React, Node.js). It provides a secure, fast, and intuitive interface for storing and managing your personal files in the cloud.

## Features

- **Authentication and Security:** Secure user registration and login using JSON Web Tokens (JWT).
- **File Management:** Upload files of any type (up to 500MB). Files are securely hosted via Cloudinary.
- **Folder Navigation:** Create nested folders, move files, and navigate seamlessly through breadcrumbs.
- **Trash and Soft Deletion:** Deleted files are moved to the Trash bin where they can be restored.
- **Automated Cleanup:** A backend cron job automatically purges files from the Trash after 15 days to free up space.
- **Starred Items:** Quick access to starred files and folders.
- **File Sharing:** Share files with other registered users, assigning them 'view' or 'edit' permissions.
- **Storage Quotas:** Real-time tracking of storage used against the user's 500MB limit.
- **AI Auto Rename:** Uses Gemini 2.5 Flash to automatically rename files based on metadata and structure.
- **Multimodal File Chat:** Real-time chat workspace inside preview modals to query file contents directly.

## Tech Stack

**Frontend:**
- React (Vite)
- Redux Toolkit (State Management)
- Tailwind CSS (Styling)
- Axios (API Requests)

**Backend:**
- Node.js and Express.js
- MongoDB and Mongoose (Database and ORM)
- Cloudinary and Multer (File Upload and Cloud Storage)
- node-cron (Scheduled Tasks)
- JSON Web Tokens (Auth)

## Folder Structure

Below is the directory structure of the DriveX project:

```
.
├── client
│   ├── public
│   └── src
│       ├── assets
│       ├── components
│       │   ├── FilePreviewModal.jsx
│       │   ├── FolderModal.jsx
│       │   ├── Layout.jsx
│       │   ├── RenameModal.jsx
│       │   ├── ShareLinkModal.jsx
│       │   └── UploadModal.jsx
│       ├── pages
│       │   ├── Dashboard.jsx
│       │   ├── DocumentEditor.jsx
│       │   ├── Login.jsx
│       │   ├── PublicShareView.jsx
│       │   ├── SharedFiles.jsx
│       │   ├── StarredFiles.jsx
│       │   ├── StorageAnalytics.jsx
│       │   ├── TaggedFiles.jsx
│       │   └── Trash.jsx
│       ├── store
│       └── utils
├── server
│   ├── config
│   ├── controllers
│   │   ├── authController.js
│   │   ├── cleanupController.js
│   │   ├── fileController.js
│   │   ├── folderController.js
│   │   ├── publicShareController.js
│   │   └── shareController.js
│   ├── jobs
│   ├── middlewares
│   ├── models
│   ├── routes
│   │   ├── auth.js
│   │   ├── files.js
│   │   ├── folders.js
│   │   ├── publicShare.js
│   │   └── share.js
│   └── utils
└── README.md
```

## Local Development Setup

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
node server.js
```

### 3. Frontend Setup
Navigate to the client directory and install dependencies:
```bash
cd ../client
npm install
```

Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the React development server:
```bash
npm run dev
```

### 4. Access the App
Open your browser and navigate to `http://localhost:5173`.

## How to Build for Production

### Build the Frontend
To compile and minify the frontend assets for production:
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Run the build script:
   ```bash
   npm run build
   ```
This creates a `dist` directory in the `client` folder, containing the production-ready static assets.

To preview the production build locally, run:
```bash
npm run preview
```

### Run the Backend
Ensure the backend server runs with the proper production environment variables set. Start the server using:
```bash
node server.js
```

## License
This project is open source and available under the MIT License.
