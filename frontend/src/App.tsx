import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './components/Home';
import MemberLogin from './components/MemberLogin';
import MemberSignup from './components/MemberSignup';
import OAuth2RedirectHandler from './components/OAuth2RedirectHandler';
import OAuthRedirect from './components/OAuthRedirect';
import MemberSocialExtra from './components/MemberSocialExtra';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<MemberLogin />} />
            <Route path="/signup" element={<MemberSignup />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
            <Route path="/oauth/redirect" element={<OAuthRedirect />} />
            <Route path="/members/social-extra" element={<MemberSocialExtra />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;