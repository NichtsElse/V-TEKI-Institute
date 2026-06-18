/**
 * Purpose: Register public and protected routes for the local V-TEKI MVP application.
 * Used by: `src/main.jsx` as the root React application shell.
 * Main dependencies: React Router, auth provider, public layout, dashboard layout, and page modules.
 * Public/main functions: Default `App` export and internal `AuthenticatedApp` route tree.
 * Important side effects: Mounts auth-aware routing and role-based dashboard aliases for demo flows.
 */
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Programs from '@/pages/public/Programs';
import ProgramDetail from '@/pages/public/ProgramDetail';
import Trainers from '@/pages/public/Trainers';
import VerifyCertificate from '@/pages/public/VerifyCertificate';
import RegisterProgram from '@/pages/public/RegisterProgram';

import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminPrograms from '@/pages/admin/AdminPrograms';
import AdminBatches from '@/pages/admin/AdminBatches';
import AdminRegistrations from '@/pages/admin/AdminRegistrations';
import AdminPayments from '@/pages/admin/AdminPayments';

import AdminCertificates from '@/pages/admin/AdminCertificates';
import AdminTrainers from '@/pages/admin/AdminTrainers';
import AdminAttendance from '@/pages/admin/AdminAttendance';
import AdminAssessments from '@/pages/admin/AdminAssessments';
import AdminAssessmentQuestions from '@/pages/admin/AdminAssessmentQuestions';
import AdminFeedback from '@/pages/admin/AdminFeedback';
import AdminUsers from '@/pages/admin/AdminUsers';
import BatchDetail from '@/pages/admin/BatchDetail';
import AdminReports from '@/pages/admin/AdminReports';
// Participant pages
import StudentDashboard from '@/pages/participant/StudentDashboard';
import MyPrograms from '@/pages/participant/MyPrograms';
import MyAssessments from '@/pages/participant/MyAssessments';
import MyCertificates from '@/pages/participant/MyCertificates';
import Profile from '@/pages/participant/Profile';
import TrainerDashboard from '@/pages/trainer/TrainerDashboard';
import TrainerAssessments from '@/pages/trainer/TrainerAssessments';
import TrainerAttendance from '@/pages/trainer/TrainerAttendance';
import TrainerBatches from '@/pages/trainer/TrainerBatches';
import TrainerFeedback from '@/pages/trainer/TrainerFeedback';
import TrainerReports from '@/pages/trainer/TrainerReports';
import AssessmentTake from '@/pages/participant/AssessmentTake';
import FeedbackSubmit from '@/pages/participant/FeedbackSubmit';
import CorporateDashboard from '@/pages/corporate/CorporateDashboard';
import CorporateParticipants from '@/pages/corporate/CorporateParticipants';
import CorporateInvoices from '@/pages/corporate/CorporateInvoices';
import CorporateReports from '@/pages/corporate/CorporateReports';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/programs/:id" element={<ProgramDetail />} />
        <Route path="/trainers" element={<Trainers />} />

        <Route path="/verify-certificate" element={<VerifyCertificate />} />
        <Route path="/register-program/:batchId" element={<RegisterProgram />} />
      </Route>

      {/* Protected dashboard routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<DashboardLayout />}>
          {/* Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'academy_admin', 'super_admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/programs" element={<AdminPrograms />} />
            <Route path="/admin/batches" element={<AdminBatches />} />
            <Route path="/admin/batches/:batchId" element={<BatchDetail />} />
            <Route path="/admin/registrations" element={<AdminRegistrations />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/certificates" element={<AdminCertificates />} />
            <Route path="/admin/trainers" element={<AdminTrainers />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/assessments" element={<AdminAssessments />} />
            <Route path="/admin/assessments/:assessmentId/questions" element={<AdminAssessmentQuestions />} />
            <Route path="/admin/feedback" element={<AdminFeedback />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>
          {/* Participant routes */}
          <Route element={<ProtectedRoute allowedRoles={['participant', 'user', 'corporate_pic']} />}>
            <Route path="/participant/dashboard" element={<StudentDashboard />} />
            <Route path="/participant/programs" element={<MyPrograms />} />
            <Route path="/participant/assessments" element={<MyAssessments />} />
            <Route path="/participant/assessments/:assessmentId/take" element={<AssessmentTake />} />
            <Route path="/participant/certificates" element={<MyCertificates />} />
            <Route path="/participant/feedback/:enrollmentId" element={<FeedbackSubmit />} />
            <Route path="/participant/profile" element={<Profile />} />
          </Route>
          {/* Trainer routes */}
          <Route element={<ProtectedRoute allowedRoles={['trainer']} />}>
            <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
            <Route path="/trainer/batches" element={<TrainerBatches />} />
            <Route path="/trainer/attendance" element={<TrainerAttendance />} />
            <Route path="/trainer/assessments" element={<TrainerAssessments />} />
            <Route path="/trainer/assessments/:assessmentId/questions" element={<AdminAssessmentQuestions />} />
            <Route path="/trainer/feedback" element={<TrainerFeedback />} />
            <Route path="/trainer/reports" element={<TrainerReports />} />
          </Route>
          {/* Corporate routes */}
          <Route element={<ProtectedRoute allowedRoles={['corporate_pic']} />}>
            <Route path="/corporate/dashboard" element={<CorporateDashboard />} />
            <Route path="/corporate/registrations" element={<CorporateParticipants />} />
            <Route path="/corporate/invoices" element={<CorporateInvoices />} />
            <Route path="/corporate/reports" element={<CorporateReports />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
