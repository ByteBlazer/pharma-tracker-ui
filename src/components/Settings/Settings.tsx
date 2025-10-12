import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import { LocationOn, CropFree, Backup, Restore } from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiService } from "../../hooks/useApiService";
import { Setting } from "../../types/Setting";
import { API_ENDPOINTS, SETTING_NAMES } from "../../constants/GlobalConstants";
import ModalInfiniteSpinner from "../ModalInfiniteSpinner/ModalInfiniteSpinner";

const Settings: React.FC = () => {
  const { get, put, post } = useApiService();
  const queryClient = useQueryClient();
  const [coolOffValue, setCoolOffValue] = useState("");
  const [heartbeatValue, setHeartbeatValue] = useState("");

  // Fetch cool off setting
  const { data: coolOffSetting, isLoading: coolOffLoading } = useQuery<Setting>(
    {
      queryKey: [
        "setting",
        SETTING_NAMES.COOL_OFF_SECONDS_BTWN_DIFF_ROUTE_SCANS,
      ],
      queryFn: () =>
        get(
          API_ENDPOINTS.SETTING(
            SETTING_NAMES.COOL_OFF_SECONDS_BTWN_DIFF_ROUTE_SCANS
          )
        ),
    }
  );

  // Fetch heartbeat setting
  const { data: heartbeatSetting, isLoading: heartbeatLoading } =
    useQuery<Setting>({
      queryKey: ["setting", SETTING_NAMES.MINS_BETWEEN_LOCATION_HEARTBEATS],
      queryFn: () =>
        get(
          API_ENDPOINTS.SETTING(SETTING_NAMES.MINS_BETWEEN_LOCATION_HEARTBEATS)
        ),
    });

  // Update cool off setting mutation
  const coolOffMutation = useMutation({
    mutationFn: (value: string) =>
      put(API_ENDPOINTS.UPDATE_SETTING, {
        settingName: SETTING_NAMES.COOL_OFF_SECONDS_BTWN_DIFF_ROUTE_SCANS,
        settingValue: value,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "setting",
          SETTING_NAMES.COOL_OFF_SECONDS_BTWN_DIFF_ROUTE_SCANS,
        ],
      });
    },
  });

  // Update heartbeat setting mutation
  const heartbeatMutation = useMutation({
    mutationFn: (value: string) =>
      put(API_ENDPOINTS.UPDATE_SETTING, {
        settingName: SETTING_NAMES.MINS_BETWEEN_LOCATION_HEARTBEATS,
        settingValue: value,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["setting", SETTING_NAMES.MINS_BETWEEN_LOCATION_HEARTBEATS],
      });
    },
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: () => post(API_ENDPOINTS.CREATE_BACKUP, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (coolOffSetting?.settingValue) {
      setCoolOffValue(coolOffSetting.settingValue);
    }
  }, [coolOffSetting]);

  useEffect(() => {
    if (heartbeatSetting?.settingValue) {
      setHeartbeatValue(heartbeatSetting.settingValue);
    }
  }, [heartbeatSetting]);

  const handleCoolOffSave = () => {
    coolOffMutation.mutate(coolOffValue);
  };

  const handleHeartbeatSave = () => {
    heartbeatMutation.mutate(heartbeatValue);
  };

  const handleCreateBackup = () => {
    createBackupMutation.mutate();
  };

  const handleCoolOffChange = (value: string) => {
    setCoolOffValue(value);
    // Reset mutation state when user changes value
    if (coolOffMutation.isSuccess) {
      coolOffMutation.reset();
    }
  };

  const handleHeartbeatChange = (value: string) => {
    setHeartbeatValue(value);
    // Reset mutation state when user changes value
    if (heartbeatMutation.isSuccess) {
      heartbeatMutation.reset();
    }
  };

  // Cool off options (seconds)
  const coolOffOptions = [
    { value: "30", label: "30 seconds" },
    { value: "60", label: "1 minute" },
    { value: "120", label: "2 minutes" },
    { value: "300", label: "5 minutes" },
    { value: "600", label: "10 minutes" },
  ];

  // Heartbeat options (minutes)
  const heartbeatOptions = [
    { value: "1", label: "1 minute" },
    { value: "3", label: "3 minutes" },
    { value: "5", label: "5 minutes" },
    { value: "10", label: "10 minutes" },
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
  ];

  // Add current values to options if they're not already there
  const allCoolOffOptions = [
    ...coolOffOptions,
    ...(coolOffValue &&
    !coolOffOptions.find((opt) => opt.value === coolOffValue)
      ? [{ value: coolOffValue, label: `${coolOffValue} seconds` }]
      : []),
  ];

  const allHeartbeatOptions = [
    ...heartbeatOptions,
    ...(heartbeatValue &&
    !heartbeatOptions.find((opt) => opt.value === heartbeatValue)
      ? [{ value: heartbeatValue, label: `${heartbeatValue} minutes` }]
      : []),
  ];

  if (coolOffLoading || heartbeatLoading) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" color="primary" gutterBottom>
          Mobile App Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Manage your mobile app settings
        </Typography>
        <Alert severity="warning" sx={{ maxWidth: 600 }}>
          <Typography variant="body2">
            <strong>Global Settings Warning:</strong> These settings are global
            and will affect all users of the mobile app. Please exercise caution
            when modifying these values as changes will impact the entire
            system.
          </Typography>
        </Alert>
      </Box>

      {/* Settings Cards */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {/* Heartbeat Setting */}
        <Card sx={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "280px" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <LocationOn color="primary" sx={{ mr: 2 }} />
              <Typography variant="h6">Location Heartbeat</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The frequency at which location updates are sent to the server,
              from the mobile app.
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Heartbeat Interval</InputLabel>
              <Select
                value={heartbeatValue || ""}
                onChange={(e) => handleHeartbeatChange(e.target.value)}
                label="Heartbeat Interval"
                displayEmpty
              >
                {allHeartbeatOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleHeartbeatSave}
              disabled={heartbeatMutation.isPending}
              fullWidth
            >
              {heartbeatMutation.isPending ? "Saving..." : "Save Setting"}
            </Button>
            {heartbeatMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Failed to save setting. Please try again.
              </Alert>
            )}
            {heartbeatMutation.isSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Setting saved successfully!
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Cool Off Setting */}
        <Card sx={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "280px" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <CropFree color="primary" sx={{ mr: 2 }} />
              <Typography variant="h6">Route Scan Cool Off</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The time interval after which scans from a different route is
              permitted, in the mobile app.
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Cool Off Period</InputLabel>
              <Select
                value={coolOffValue || ""}
                onChange={(e) => handleCoolOffChange(e.target.value)}
                label="Cool Off Period"
                displayEmpty
              >
                {allCoolOffOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleCoolOffSave}
              disabled={coolOffMutation.isPending}
              fullWidth
            >
              {coolOffMutation.isPending ? "Saving..." : "Save Setting"}
            </Button>
            {coolOffMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Failed to save setting. Please try again.
              </Alert>
            )}
            {coolOffMutation.isSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Setting saved successfully!
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Database Backup Card */}
        <Card sx={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "280px" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Backup color="primary" sx={{ mr: 2 }} />
              <Typography variant="h6">Database Backup</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create a backup of the database. This will upload a compressed
              backup file to S3 storage.
            </Typography>
            <Button
              variant="contained"
              onClick={handleCreateBackup}
              disabled={createBackupMutation.isPending}
              fullWidth
              startIcon={
                createBackupMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Backup />
                )
              }
            >
              {createBackupMutation.isPending
                ? "Creating Backup..."
                : "Create Backup"}
            </Button>
            {createBackupMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {(createBackupMutation.error as any)?.message ||
                  "Failed to create backup. Please try again."}
              </Alert>
            )}
            {createBackupMutation.isSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Backup created successfully:{" "}
                {(createBackupMutation.data as any)?.filename}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Database Restore Card */}
        <Card sx={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "280px" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Restore color="error" sx={{ mr: 2 }} />
              <Typography variant="h6">Database Restore</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              ⚠️ DESTRUCTIVE: Restore database from a backup file. This will
              delete all current data.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              startIcon={<Restore />}
              onClick={() => alert("Restore functionality coming soon...")}
            >
              Restore Database
            </Button>
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="caption">
                Requires passkey and recent safety backup
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>

      {/* Loading Spinners for Save Operations */}
      <ModalInfiniteSpinner
        condition={coolOffMutation.isPending}
        title="Saving Cool Off Setting..."
      />
      <ModalInfiniteSpinner
        condition={heartbeatMutation.isPending}
        title="Saving Heartbeat Setting..."
      />
      <ModalInfiniteSpinner
        condition={createBackupMutation.isPending}
        title="Creating backup... This may take a few minutes."
      />
    </Box>
  );
};

export default Settings;
