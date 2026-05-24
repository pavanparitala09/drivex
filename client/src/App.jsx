import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedLayout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SharedFiles from './pages/SharedFiles';
import StarredFiles from './pages/StarredFiles';
import Trash from './pages/Trash';
import StorageAnalytics from './pages/StorageAnalytics';
import TaggedFiles from './pages/TaggedFiles';
import DocumentEditor from './pages/DocumentEditor';
import PublicShareView from './pages/PublicShareView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Unauthenticated Public Share Landing Lock Screen */}
        <Route path="/shared/public/:token" element={<PublicShareView />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/shared" element={<SharedFiles />} />
          <Route path="/starred" element={<StarredFiles />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/storage" element={<StorageAnalytics />} />
          <Route path="/tags/:tagName" element={<TaggedFiles />} />
          <Route path="/editor/:id" element={<DocumentEditor />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
