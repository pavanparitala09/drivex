import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedLayout } from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SharedFiles from './pages/SharedFiles';
import StarredFiles from './pages/StarredFiles';
import Trash from './pages/Trash';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/shared" element={<SharedFiles />} />
          <Route path="/starred" element={<StarredFiles />} />
          <Route path="/trash" element={<Trash />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
