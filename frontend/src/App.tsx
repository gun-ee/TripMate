
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
// import TripPlanPage from './components/TripPlan';
import PlanPage from './components/PlanPage';
import TripResultPage from './components/TripResultPage';
import MyPage from './components/MyPage';
import AccompanyManage from './components/AccompanyManage';
import AccompanyList from './components/accompany/AccompanyList';
import AccompanyDetail from './components/accompany/AccompanyDetail';
import AccompanyEdit from './components/accompany/AccompanyEdit';
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
              <Route path="/plan" element={<PlanPage />} />
              <Route path="/trip/result" element={<TripResultPage />} />
              <Route path="/members/mypage" element={<MyPage />} />
              <Route path="/members/mypage/accompany" element={<AccompanyManage />} />
              <Route path="/accompany" element={<AccompanyList />} />
              <Route path="/accompany/:id" element={<AccompanyDetail />} />
              <Route path="/accompany/:id/edit" element={<AccompanyEdit />} />
            </Routes>
          </div>
        </Router>
      </PostProvider>
    </AuthProvider>
  );
}

export default App;