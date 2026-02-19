import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelect from './pages/RoleSelect';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ClientDashboard from './pages/dashboard/ClientDashboard';
import CandidateDashboard from './pages/dashboard/CandidateDashboard';
import CreateJob from './pages/jobs/CreateJob';
import EditJob from './pages/jobs/EditJob';
import JobDetails from './pages/jobs/JobDetails';
import JobApplicants from './pages/jobs/JobApplicants';
import ApplicationAnalysis from './pages/applications/ApplicationAnalysis';
import MyApplications from './pages/applications/MyApplications';
import ManageUsers from './pages/admin/ManageUsers';
import ManageRoles from './pages/admin/ManageRoles';
import ManageJobs from './pages/admin/ManageJobs';
import './App.css';

const DashboardRedirect = () => {
  const { user } = useAuth()!;
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'client') return <ClientDashboard />;
  return <CandidateDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public: Role selection landing page */}
          <Route path="/" element={<RoleSelect />} />
          <Route path="/login/:role" element={<Login />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected: Dashboard & features */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/jobs/new" element={<CreateJob />} />
              <Route path="/jobs/:id/edit" element={<EditJob />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              <Route path="/jobs/:id/applicants" element={<JobApplicants />} />
              <Route path="/applications/:id/analysis" element={<ApplicationAnalysis />} />
              <Route path="/applications" element={<MyApplications />} />
              <Route path="/admin/users" element={<ManageUsers />} />
              <Route path="/admin/roles" element={<ManageRoles />} />
              <Route path="/admin/jobs" element={<ManageJobs />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
