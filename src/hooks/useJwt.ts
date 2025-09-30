import { useContext } from "react";
import { GlobalContext } from "../components/GlobalContextProvider";
import { LoggedInUser } from "../types";

export const useJwt = () => {
  const context = useContext(GlobalContext);

  if (!context) {
    throw new Error("useJwt must be used within a GlobalContextProvider");
  }

  const { jwtToken, setJwtToken, decodedToken, isTokenValid, isTokenExpired } =
    context;

  // Helper functions
  const getUserInfo = () => {
    if (!decodedToken) return null;

    return {
      id: decodedToken.id,
      username: decodedToken.username,
      mobile: decodedToken.mobile,
      roles: decodedToken.roles,
      locationHeartBeatFrequencyInSeconds:
        decodedToken.locationHeartBeatFrequencyInSeconds,
      baseLocationId: decodedToken.baseLocationId,
      baseLocationName: decodedToken.baseLocationName,
      issuedAt: decodedToken.iat ? new Date(decodedToken.iat * 1000) : null,
      expiresAt: decodedToken.exp ? new Date(decodedToken.exp * 1000) : null,
    };
  };

  const hasRole = (role: string) => {
    if (!decodedToken?.roles) return false;
    const userRoles = decodedToken.roles.split(",").map((r) => r.trim());
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: string[]) => {
    if (!decodedToken?.roles) return false;
    const userRoles = decodedToken.roles.split(",").map((r) => r.trim());
    return roles.some((role) => userRoles.includes(role));
  };

  const getAllRoles = () => {
    if (!decodedToken?.roles) return [];
    return decodedToken.roles.split(",").map((r) => r.trim());
  };

  const logout = () => {
    setJwtToken("");
    localStorage.removeItem("jwtToken");
  };

  return {
    // Token data
    jwtToken,
    decodedToken,
    isTokenValid,
    isTokenExpired,

    // Actions
    setJwtToken,
    logout,

    // Helper functions
    getUserInfo,
    hasRole,
    hasAnyRole,
    getAllRoles,
  };
};
