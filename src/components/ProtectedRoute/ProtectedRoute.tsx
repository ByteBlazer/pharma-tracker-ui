import { useContext } from "react";
import { Navigate } from "react-router";
import { GlobalContext } from "../GlobalContextProvider";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { jwtToken, isTokenValid, isTokenExpired, clearJwtToken } =
    useContext(GlobalContext);

  // Check if user is authenticated with valid token
  const isAuthenticated = jwtToken !== "" && isTokenValid;

  if (!isAuthenticated) {
    // Clear invalid/expired token
    if (jwtToken && (isTokenExpired || !isTokenValid)) {
      clearJwtToken();
    }
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;
