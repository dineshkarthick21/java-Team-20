import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import LandingPage from './pages/LandingPage';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user) {
    // Not logged in, redirect to signin with role parameter
    return <Navigate to={`/signin?role=${requiredRole}`} replace />;
  }
  
  return children;
}

function Navigation() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';
  const isLandingPage = location.pathname === '/';

  if (isAuthPage || isLandingPage) {
    return null; // Don't show navigation on auth pages or landing page
  }

  return (
    <nav className="bg-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white text-xl font-bold hover:text-gray-200 transition">
              Campus Resource Management
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/signin?role=student"
              className="text-white hover:bg-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Student View
            </Link>
            <Link
              to="/signin?role=staff"
              className="text-white hover:bg-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Staff View
            </Link>
            <Link
              to="/signin?role=admin"
              className="text-white hover:bg-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Admin View
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navigation />

        {/* Routes */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route 
            path="/student" 
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff" 
            element={
              <ProtectedRoute requiredRole="staff">
                <StaffDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
