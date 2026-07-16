import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./Components/Header";
import Footer from "./Components/Footer";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Registration from "./Pages/Registration";
import Signup from "./Pages/Signup";
import Events from "./Pages/Events";
import Admin from "./Pages/Admin";
import EvaluationPage from "./Pages/Evaluation";
import ProfilePage from "./Pages/Profile";
import Statistics from "./Pages/Statistics";
import UserManagementPage from "./Pages/UserManagement";
import ManualTeamEntryPage from "./Pages/ManualTeamEntry";
import TeamManagementPage from "./Pages/TeamManagement";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import TermsAndConditions from "./Pages/TermsAndConditions";

const App = () => {
  return (
    <div className="min-h-screen bg-amber-50 text-textLight font-body">
      <Router>
        <Header />
        <main className="max-w-[100%] mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="events" element={<Events />} />
            <Route path="admin" element={<Admin />} />
            <Route path="admin/users" element={<UserManagementPage />} />
            <Route path="admin/events/:eventId/manual-entry" element={<ManualTeamEntryPage />} />
            <Route path="admin/events/:eventId/teams" element={<TeamManagementPage />} />
            <Route path="login" element={<Login />} />
            <Route path="evaluate" element={<EvaluationPage />} />
            <Route path="register" element={<Registration />} />
            <Route path="register/:eventId" element={<Registration />} />
            <Route path="signup" element={<Signup />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="statistics/:eventId" element={<Statistics />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="terms" element={<TermsAndConditions />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
};

export default App;
