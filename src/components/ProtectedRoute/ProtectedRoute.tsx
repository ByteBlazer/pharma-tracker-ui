import { useContext, useEffect } from "react";
import { Navigate } from "react-router";
import { GlobalContext } from "../GlobalContextProvider";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { jwtToken, isTokenValid, isTokenExpired, clearJwtToken } =
    useContext(GlobalContext);

  // Check if user is authenticated with valid token
  const isAuthenticated = jwtToken !== "" && isTokenValid;

  // Clear invalid/expired token using useEffect to avoid calling during render
  useEffect(() => {
    if (jwtToken && (isTokenExpired || !isTokenValid)) {
      clearJwtToken();
    }
  }, [jwtToken, isTokenExpired, isTokenValid, clearJwtToken]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;
