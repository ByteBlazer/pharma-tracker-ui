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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import {
  LocationOn,
  CropFree,
  Backup,
  Restore,
  Download,
  Sync,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiService } from "../../hooks/useApiService";
import { Setting } from "../../types/Setting";
import { API_ENDPOINTS, SETTING_NAMES } from "../../constants/GlobalConstants";
import ModalInfiniteSpinner from "../ModalInfiniteSpinner/ModalInfiniteSpinner";
import {
  BackupListResponse,
  BackupFile,
  RestoreBackupRequest,
} from "../../types/Backup";
import { useContext } from "react";
import { GlobalContext } from "../GlobalContextProvider";

const Settings: React.FC = () => {
  const { get, put, post } = useApiService();
  const { jwtToken } = useContext(GlobalContext);
  const queryClient = useQueryClient();
  const [coolOffValue, setCoolOffValue] = useState("");
  const [heartbeatValue, setHeartbeatValue] = useState("");
  const [updateDocStatusValue, setUpdateDocStatusValue] = useState("");
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
  const [restorePasskey, setRestorePasskey] = useState("");
  const [confirmationChecked, setConfirmationChecked] = useState(false);

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

  // Fetch update doc status setting
  const { data: updateDocStatusSetting, isLoading: updateDocStatusLoading } =
    useQuery<Setting>({
      queryKey: ["setting", SETTING_NAMES.UPDATE_DOC_STATUS_TO_ERP],
      queryFn: () =>
        get(API_ENDPOINTS.SETTING(SETTING_NAMES.UPDATE_DOC_STATUS_TO_ERP)),
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

  // Update doc status setting mutation
  const updateDocStatusMutation = useMutation({
    mutationFn: (value: string) =>
      put(API_ENDPOINTS.UPDATE_SETTING, {
        settingName: SETTING_NAMES.UPDATE_DOC_STATUS_TO_ERP,
        settingValue: value,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["setting", SETTING_NAMES.UPDATE_DOC_STATUS_TO_ERP],
      });
    },
  });

  // Fetch backup list
  const {
    data: backupListData,
    isLoading: backupsLoading,
    refetch: refetchBackups,
  } = useQuery<BackupListResponse>({
    queryKey: ["backups"],
    queryFn: () => get(API_ENDPOINTS.LIST_BACKUPS),
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: () => post(API_ENDPOINTS.CREATE_BACKUP, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: (request: RestoreBackupRequest) =>
      post(API_ENDPOINTS.RESTORE_BACKUP, request),
    onSuccess: () => {
      // Log out user after successful restore
      localStorage.removeItem("token");
      sessionStorage.clear();
      window.location.href = "/login";
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

  useEffect(() => {
    if (updateDocStatusSetting?.settingValue) {
      setUpdateDocStatusValue(updateDocStatusSetting.settingValue);
    }
  }, [updateDocStatusSetting]);

  const handleCoolOffSave = () => {
    coolOffMutation.mutate(coolOffValue);
  };

  const handleHeartbeatSave = () => {
    heartbeatMutation.mutate(heartbeatValue);
  };

  const handleUpdateDocStatusSave = () => {
    updateDocStatusMutation.mutate(updateDocStatusValue);
  };

  const handleCreateBackup = () => {
    createBackupMutation.mutate();
  };

  const handleOpenRestoreDialog = (backup: BackupFile) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
    setRestorePasskey("");
    setConfirmationChecked(false);
  };

  const handleCloseRestoreDialog = () => {
    setRestoreDialogOpen(false);
    setSelectedBackup(null);
    setRestorePasskey("");
    setConfirmationChecked(false);
    restoreBackupMutation.reset();
  };

  const handleRestoreConfirm = () => {
    if (!selectedBackup || !restorePasskey || !confirmationChecked) return;

    restoreBackupMutation.mutate({
      filename: selectedBackup.filename,
      passkey: restorePasskey,
    });
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      // Use the same authentication as other API calls
      const response = await fetch(API_ENDPOINTS.DOWNLOAD_BACKUP(filename), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Download failed: ${error.message}`);
        return;
      }

      // Get the file as blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download backup file");
    }
  };

  // Helper function to parse backup info from filename
  // Format: pharmatracker-${env}-${type}-on-${date}-at-${time}.dump
  // Example: pharmatracker-staging-Manual-on-2025-01-15-at-02-30-23-PM-IST.dump
  const parseBackupFilename = (filename: string) => {
    try {
      const parts = filename.split("-on-");
      const prefix = parts[0]; // pharmatracker-${env}-${type}

      // Remove "pharmatracker-" prefix
      const withoutApp = prefix.replace("pharmatracker-", ""); // staging-Manual

      // Split by hyphen - first part is environment, second is type
      const prefixParts = withoutApp.split("-");
      const environment = prefixParts[0] || "unknown"; // staging or production
      const type = prefixParts[1] || "Unknown"; // Auto or Manual

      return {
        environment,
        type,
      };
    } catch (error) {
      console.error("Error parsing backup filename:", filename, error);
      return {
        environment: "unknown",
        type: "Unknown",
      };
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  // Helper function to format date
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
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

  const handleUpdateDocStatusChange = (value: string) => {
    setUpdateDocStatusValue(value);
    // Reset mutation state when user changes value
    if (updateDocStatusMutation.isSuccess) {
      updateDocStatusMutation.reset();
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

  if (coolOffLoading || heartbeatLoading || updateDocStatusLoading) {
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
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Typography
        variant="h4"
        component="h1"
        color="primary"
        gutterBottom
        sx={{ mb: 4 }}
      >
        Settings
      </Typography>

      {/* Mobile App Settings Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Mobile App Settings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Manage settings for the mobile app
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Alert severity="warning" sx={{ maxWidth: 800 }}>
              <Typography variant="body2">
                <strong>Global Settings Warning:</strong> These settings are
                global and will affect all users of the mobile app. Please
                exercise caution when modifying these values as changes will
                impact the entire system.
              </Typography>
            </Alert>
          </Box>
        </Box>

        {/* Mobile App Settings Cards */}
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {/* Heartbeat Setting */}
          <Card
            sx={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "280px" }}
          >
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
          <Card
            sx={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "280px" }}
          >
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

          {/* Update Doc Status to ERP Setting */}
          <Card
            sx={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "280px" }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Sync color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Update Doc Status to ERP</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Controls whether document status updates are sent to the ERP
                system from the mobile app.
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Enable ERP Updates</InputLabel>
                <Select
                  value={updateDocStatusValue || ""}
                  onChange={(e) => handleUpdateDocStatusChange(e.target.value)}
                  label="Enable ERP Updates"
                  displayEmpty
                >
                  <MenuItem value="true">Enabled</MenuItem>
                  <MenuItem value="false">Disabled</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleUpdateDocStatusSave}
                disabled={updateDocStatusMutation.isPending}
                fullWidth
              >
                {updateDocStatusMutation.isPending
                  ? "Saving..."
                  : "Save Setting"}
              </Button>
              {updateDocStatusMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Failed to save setting. Please try again.
                </Alert>
              )}
              {updateDocStatusMutation.isSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Setting saved successfully!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Database Management Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Database Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Backup and restore database operations
          </Typography>
        </Box>

        {/* Database Management Cards */}
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {/* Database Backup Card */}
          <Card
            sx={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "280px" }}
          >
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

          {/* Database Restore Card - Full Width Row */}
          <Box
            sx={{
              flexBasis: "100%",
              display: "flex",
              justifyContent: "center",
              overflow: "hidden", // Prevent horizontal overflow
              width: "100%",
              px: 1, // Add horizontal padding to show card borders
            }}
          >
            <Card sx={{ width: "100%", maxWidth: "900px", minWidth: "280px" }}>
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Restore color="error" sx={{ mr: 2 }} />
                    <Typography variant="h6">Database Restore</Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => refetchBackups()}
                    disabled={backupsLoading}
                  >
                    Refresh
                  </Button>
                </Box>

                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Danger Zone:</strong> Database restore is a
                    destructive operation that will delete all current data.
                    Always create a backup before restoring.
                  </Typography>
                </Alert>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Restore database from a backup file. Select a backup from the
                  list below.
                </Typography>

                {backupsLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : backupListData?.backups &&
                  backupListData.backups.length > 0 ? (
                  <TableContainer
                    sx={{
                      maxHeight: 300,
                      mb: 2,
                      width: "100%",
                      overflowX: "auto",
                    }}
                  >
                    <Table size="small" stickyHeader sx={{ minWidth: 650 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Environment</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Date & Time</TableCell>
                          <TableCell>Size</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {backupListData.backups.map((backup) => {
                          const { environment, type } = parseBackupFilename(
                            backup.filename
                          );
                          const isProduction = environment === "production";
                          const isAuto = type?.toLowerCase() === "auto";

                          return (
                            <TableRow key={backup.filename}>
                              <TableCell>
                                <Chip
                                  label={environment.toUpperCase()}
                                  size="small"
                                  color={isProduction ? "error" : "info"}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={type}
                                  size="small"
                                  color={isAuto ? "default" : "success"}
                                  variant={isAuto ? "outlined" : "filled"}
                                />
                              </TableCell>
                              <TableCell>
                                {formatDate(backup.lastModified)}
                              </TableCell>
                              <TableCell>
                                {formatFileSize(backup.size)}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<Download />}
                                    onClick={() =>
                                      handleDownloadBackup(backup.filename)
                                    }
                                  >
                                    Download
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() =>
                                      handleOpenRestoreDialog(backup)
                                    }
                                  >
                                    Restore
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No backups available. Create a backup first.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
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
        condition={updateDocStatusMutation.isPending}
        title="Saving ERP Update Setting..."
      />
      <ModalInfiniteSpinner
        condition={createBackupMutation.isPending}
        title="Creating backup... This may take a few minutes."
      />
      <ModalInfiniteSpinner
        condition={restoreBackupMutation.isPending}
        title="Restoring database... Please do not refresh or close this page."
      />

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={restoreDialogOpen}
        onClose={handleCloseRestoreDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ bgcolor: "error.main", color: "error.contrastText" }}
        >
          ⚠️ Restore Database - DESTRUCTIVE OPERATION
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedBackup && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                You are about to restore the database from:
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  {selectedBackup.filename}
                </Typography>
                <Typography variant="caption" display="block">
                  Environment:{" "}
                  {parseBackupFilename(
                    selectedBackup.filename
                  ).environment.toUpperCase()}
                </Typography>
                <Typography variant="caption" display="block">
                  Type: {parseBackupFilename(selectedBackup.filename).type}
                </Typography>
                <Typography variant="caption" display="block">
                  Created: {formatDate(selectedBackup.lastModified)}
                </Typography>
                <Typography variant="caption">
                  Size: {formatFileSize(selectedBackup.size)}
                </Typography>
              </Alert>

              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  This will:
                </Typography>
                <Typography variant="body2">
                  ❌ DELETE all current data in the database
                </Typography>
                <Typography variant="body2">
                  ✅ REPLACE with data from the selected backup
                </Typography>
                <Typography variant="body2">⚠️ LOG OUT all users</Typography>
              </Alert>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={confirmationChecked}
                    onChange={(e) => setConfirmationChecked(e.target.checked)}
                  />
                }
                label="I understand this will delete all current data"
              />

              <TextField
                fullWidth
                type="password"
                label="Restore Passkey"
                value={restorePasskey}
                onChange={(e) => setRestorePasskey(e.target.value)}
                sx={{ mt: 2 }}
                placeholder="Enter restore passkey"
              />

              {restoreBackupMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(restoreBackupMutation.error as any)?.message ||
                    "Failed to restore backup. Please try again."}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRestoreDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRestoreConfirm}
            disabled={
              !confirmationChecked ||
              !restorePasskey ||
              restoreBackupMutation.isPending
            }
          >
            Restore Database
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
