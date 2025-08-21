// components/ProtectedRoute.jsx
import { useAuth } from '@/contexts/AuthContext';
import Loading from './Loading';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    window.location.href = '/403';
    return null;
  }

  return children;
};

export default ProtectedRoute;