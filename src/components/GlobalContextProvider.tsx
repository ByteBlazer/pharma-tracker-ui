import { createContext } from "react";
import { useLocalStorage } from "usehooks-ts";
import { jwtDecode } from "jwt-decode";
import { LoggedInUser } from "../types";

export const GlobalContext = createContext({
  jwtToken: "",
  setJwtToken: (jwtToken: string) => {},
  clearJwtToken: () => {},
  loggedInUser: null as LoggedInUser | null,
  isTokenValid: false,
  isTokenExpired: false,
});

export const GlobalContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [jwtToken, setJwtToken, clearJwtToken] = useLocalStorage(
    "jwtToken",
    ""
  );

  // Decode JWT token with error handling
  const decodeJwtToken = (token: string): LoggedInUser | null => {
    try {
      if (!token) return null;
      return jwtDecode<LoggedInUser>(token);
    } catch (error) {
      console.error("Failed to decode JWT token:", error);
      return null;
    }
  };

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      if (!token) return true;
      const decoded = jwtDecode<LoggedInUser>(token);
      if (!decoded.exp) return true;

      const currentTime = Date.now() / 1000; // Convert to seconds
      return decoded.exp < currentTime;
    } catch (error) {
      console.error("Failed to check token expiration:", error);
      return true;
    }
  };

  // Get decoded token and validation status
  const loggedInUser = decodeJwtToken(jwtToken);
  const isTokenValid = loggedInUser !== null && !isTokenExpired(jwtToken);
  const isExpired = isTokenExpired(jwtToken);

  return (
    <GlobalContext.Provider
      value={{
        jwtToken,
        setJwtToken,
        clearJwtToken,
        loggedInUser,
        isTokenValid,
        isTokenExpired: isExpired,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
