import { Navigate } from "react-router";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = false;
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return children;
}

export default ProtectedRoute;
