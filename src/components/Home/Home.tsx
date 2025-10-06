import { useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
} from "@mui/material";
import { LocationOn, Phone, Badge } from "@mui/icons-material";
import { GlobalContext } from "../GlobalContextProvider";

function Home() {
  const { loggedInUser } = useContext(GlobalContext);

  if (!loggedInUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" color="error">
          No user information available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" color="primary" gutterBottom>
          Welcome back, {loggedInUser.username}!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Here's your account information
        </Typography>
      </Box>

      {/* User Information Cards */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* User ID Card */}
        <Card sx={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "280px" }}>
          <CardContent sx={{ textAlign: "center", p: 3 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 56,
                height: 56,
                mx: "auto",
                mb: 2,
              }}
            >
              <Badge />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              User ID
            </Typography>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {loggedInUser.id}
            </Typography>
          </CardContent>
        </Card>

        {/* Phone Number Card */}
        <Card sx={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "280px" }}>
          <CardContent sx={{ textAlign: "center", p: 3 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 56,
                height: 56,
                mx: "auto",
                mb: 2,
              }}
            >
              <Phone />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Phone Number
            </Typography>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {loggedInUser.mobile}
            </Typography>
          </CardContent>
        </Card>

        {/* Base Location Card */}
        <Card sx={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "280px" }}>
          <CardContent sx={{ textAlign: "center", p: 3 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 56,
                height: 56,
                mx: "auto",
                mb: 2,
              }}
            >
              <LocationOn />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Base Location
            </Typography>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {loggedInUser.baseLocationName}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Additional Information */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h5" gutterBottom color="primary">
          Account Details
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" color="text.secondary">
              <strong>Username:</strong> {loggedInUser.username}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" color="text.secondary">
              <strong>Session Status:</strong> Active
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default Home;
