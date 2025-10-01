import { BrowserRouter, Routes, Route } from "react-router";
import AddRemoveUsers from "./AddRemoveUsers/AddRemoveUsers";
import TripDashboard from "./TripDashboard/TripDashboard";
import Home from "./Home/Home";
import Login from "./Login/Login";
import ProtectedRoute from "./ProtectedRoute/ProtectedRoute";
import { useContext } from "react";
import { GlobalContext } from "./GlobalContextProvider";

import "./App.css";
import { GlobalContextProvider } from "./GlobalContextProvider";

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
    <>
      {loggedInUser && <div>NavBar</div>}
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={<Login appName="Pharma Tracker Web" />}
          />
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
                <AddRemoveUsers />
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
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
