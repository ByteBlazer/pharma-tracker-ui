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
      {loggedInUser && <AppBar />}
      <Routes>
        <Route path="/login" element={<Login appName="Pharma Tracker Web" />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AppUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/base-locations"
          element={
            <ProtectedRoute>
              <BaseLocations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <TripDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
