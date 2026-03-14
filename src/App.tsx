import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { DashboardLayout } from './components/DashboardLayout';
import { AvailableLeads } from './pages/AvailableLeads';
import { MyLeads } from './pages/MyLeads';
import { Credits } from './pages/Credits';
import { Profile } from './pages/Profile';

const RootBoundary = () => {
  const location = useLocation();
  // If Supabase redirects to the Site URL with a recovery token, catch it here
  if (location.hash.includes('type=recovery')) {
    return <Navigate to={`/reset-password${location.hash}`} replace />;
  }
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/leads" replace />} />
          <Route path="leads" element={<AvailableLeads />} />
          <Route path="my-leads" element={<MyLeads />} />
          <Route path="credits" element={<Credits />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        <Route path="/" element={<RootBoundary />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
