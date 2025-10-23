import React, { useState } from "react";
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Home as HomeIcon,
  People as UsersIcon,
  Storefront as LocationIcon,
  LocalShipping as TripsIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router";
import { useContext } from "react";
import { GlobalContext } from "../GlobalContextProvider";

// Styling constants
const ACTIVE_BACKGROUND = "rgba(255, 255, 255, 0.2)";
const INACTIVE_BACKGROUND = "transparent";
const ACTIVE_HOVER_BACKGROUND = "rgba(255, 255, 255, 0.3)";
const INACTIVE_HOVER_BACKGROUND = "rgba(255, 255, 255, 0.15)";
const ACTIVE_FONT_WEIGHT = 600;
const INACTIVE_FONT_WEIGHT = 400;

const AppBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { clearJwtToken } = useContext(GlobalContext);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    clearJwtToken();
    navigate("/login");
    setLogoutDialogOpen(false);
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getButtonStyles = (path: string) => ({
    backgroundColor: isActive(path) ? ACTIVE_BACKGROUND : INACTIVE_BACKGROUND,
    fontWeight: isActive(path) ? ACTIVE_FONT_WEIGHT : INACTIVE_FONT_WEIGHT,
    "&:hover": {
      backgroundColor: isActive(path)
        ? ACTIVE_HOVER_BACKGROUND
        : INACTIVE_HOVER_BACKGROUND,
    },
  });

  const getIconButtonStyles = (path: string) => ({
    backgroundColor: isActive(path) ? ACTIVE_BACKGROUND : INACTIVE_BACKGROUND,
    "&:hover": {
      backgroundColor: isActive(path)
        ? ACTIVE_HOVER_BACKGROUND
        : INACTIVE_HOVER_BACKGROUND,
    },
  });

  const navigationItems = [
    { path: "/", label: "Home", icon: HomeIcon },
    { path: "/users", label: "Users", icon: UsersIcon },
    { path: "/base-locations", label: "Locations", icon: LocationIcon },
    { path: "/trips", label: "Trips", icon: TripsIcon },
  ];

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  return (
    <MuiAppBar position="sticky">
      <Toolbar>
        <Box
          sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              "&:hover": {
                opacity: 0.8,
              },
            }}
            onClick={() => navigate("/")}
          >
            <img
              src="/pharma-tracker-logo.svg"
              alt="Pharma Tracker"
              style={{
                height: "32px",
                width: "32px",
                objectFit: "contain",
              }}
            />
            {!isMobile && (
              <Typography variant="h6" component="div">
                Pharma Tracker
              </Typography>
            )}
          </Box>
        </Box>
        <Box
          sx={{ display: "flex", gap: isMobile ? 1 : 2, alignItems: "center" }}
        >
          {navigationItems.map(({ path, label, icon: Icon }) =>
            isMobile ? (
              <IconButton
                key={path}
                color="inherit"
                onClick={() => navigate(path)}
                sx={getIconButtonStyles(path)}
                title={label}
              >
                <Icon />
              </IconButton>
            ) : (
              <Button
                key={path}
                color="inherit"
                onClick={() => navigate(path)}
                sx={getButtonStyles(path)}
              >
                {label}
              </Button>
            )
          )}
          <IconButton
            color="inherit"
            onClick={handleSettingsClick}
            title="Settings"
            sx={getIconButtonStyles("/settings")}
          >
            <SettingsIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LogoutIcon sx={{ color: "primary.main" }} />
            Confirm Logout
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to logout?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleLogoutCancel}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            variant="contained"
            color="primary"
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </MuiAppBar>
  );
};

export default AppBar;
