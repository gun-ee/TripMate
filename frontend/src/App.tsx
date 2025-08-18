import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PostProvider } from './contexts/PostContext';
import Home from './components/Home';
import MemberLogin from './components/MemberLogin';
import MemberSignUp from './components/MemberSignUp';
import MemberSocialExtra from './components/MemberSocialExtra';
import OAuth2RedirectHandler from './components/OAuth2RedirectHandler';
import OAuthRedirect from './components/OAuthRedirect';
import TripTalk from './components/TripTalk';
import RegionChatExample from './components/RegionChatExample';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <PostProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<MemberLogin />} />
              <Route path="/signup" element={<MemberSignUp />} />
              <Route path="/members/social-extra" element={<MemberSocialExtra />} />
              <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
              <Route path="/oauth/redirect" element={<OAuthRedirect />} />
              <Route path="/triptalk" element={<TripTalk />} />
              <Route path="/region-chat" element={<RegionChatExample />} />
            </Routes>
          </div>
        </Router>
      </PostProvider>
    </AuthProvider>
  );
}

export default App;