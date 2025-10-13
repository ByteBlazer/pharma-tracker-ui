import { BrowserRouter, Routes, Route } from "react-router";
import AppUsers from "./AppUsers/AppUsers";
import TripDashboard from "./TripDashboard/TripDashboard";
import Home from "./Home/Home";
import Login from "./Login/Login";
import ProtectedRoute from "./ProtectedRoute/ProtectedRoute";
import AppBar from "./AppBar/AppBar";
import Settings from "./Settings/Settings";
import { useContext } from "react";
import { GlobalContext } from "./GlobalContextProvider";
import PublicTracking from "./PublicTracking/PublicTracking";

import "./App.css";
import { GlobalContextProvider } from "./GlobalContextProvider";
import BaseLocations from "./BaseLocations/BaseLocations";

function App() {
  return (
    <GlobalContextProvider>
      <AppContent />
    </GlobalContextProvider>
  );
}

function AppContent() {
  const { loggedInUser } = useContext(GlobalContext);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login appName="Pharma Tracker Web" />} />
        <Route path="/tracking" element={<PublicTracking />} />
        <Route
          path="/"
          element={
            <>
              {loggedInUser && <AppBar />}
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            </>
          }
        />

        <Route
          path="/users"
          element={
            <>
              {loggedInUser && <AppBar />}
              <ProtectedRoute>
                <AppUsers />
              </ProtectedRoute>
            </>
          }
        />
        <Route
          path="/base-locations"
          element={
            <>
              {loggedInUser && <AppBar />}
              <ProtectedRoute>
                <BaseLocations />
              </ProtectedRoute>
            </>
          }
        />
        <Route
          path="/trips"
          element={
            <>
              {loggedInUser && <AppBar />}
              <ProtectedRoute>
                <TripDashboard />
              </ProtectedRoute>
            </>
          }
        />
        <Route
          path="/settings"
          element={
            <>
              {loggedInUser && <AppBar />}
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
