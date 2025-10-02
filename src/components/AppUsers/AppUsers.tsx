import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Alert,
  Box,
  TableSortLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  ToggleButton,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  ExpandMore,
  ExpandLess,
  Edit,
  Clear,
} from "@mui/icons-material";
import { useState } from "react";
import { useApiService } from "../../hooks/useApiService";
import { User } from "../../types/User";
import { UserRole } from "../../types/UserRole";
import { BaseLocation } from "../../types/BaseLocation";
import { API_ENDPOINTS } from "../../constants/GlobalConstants";
import ModalInfiniteSpinner from "../ModalInfiniteSpinner/ModalInfiniteSpinner";

// Use the users endpoint from constants

type SortField = "id" | "personName" | "baseLocationName";
type SortDirection = "asc" | "desc";

function AppUsers() {
  const { getUsers, getUserRoles, getBaseLocations, post, put } =
    useApiService();
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showRoles, setShowRoles] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editForm, setEditForm] = useState({
    mobile: "",
    personName: "",
    baseLocationId: "",
    vehicleNbr: "",
    roles: [] as string[],
  });
  const [formErrors, setFormErrors] = useState({
    personName: false,
    mobile: false,
    baseLocationId: false,
    roles: false,
    vehicleNbr: false,
  });
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [errorModal, setErrorModal] = useState({
    open: false,
    message: "",
  });
  const [successModal, setSuccessModal] = useState({
    open: false,
    message: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch users using TanStack React Query with JWT token
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrorMsg,
  } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  // Fetch user roles
  const {
    data: allRoles,
    isLoading: rolesLoading,
    isError: rolesError,
    error: rolesErrorMsg,
  } = useQuery<UserRole[]>({
    queryKey: ["user-roles"],
    queryFn: getUserRoles,
  });

  // Fetch base locations
  const {
    data: baseLocations,
    isLoading: locationsLoading,
    isError: locationsError,
    error: locationsErrorMsg,
  } = useQuery<BaseLocation[]>({
    queryKey: ["base-locations"],
    queryFn: getBaseLocations,
  });

  // Create/Update user mutation
  const userMutation = useMutation({
    mutationFn: ({
      userData,
      isUpdate,
      userId,
    }: {
      userData: any;
      isUpdate: boolean;
      userId?: string;
    }) => {
      if (isUpdate && userId) {
        return put(API_ENDPOINTS.UPDATE_USER(userId), userData);
      } else {
        return post(API_ENDPOINTS.CREATE_USER, userData);
      }
    },
    onSuccess: () => {
      setEditingUser(null);
      setIsAddingUser(false);
      // Show success modal
      setSuccessModal({
        open: true,
        message: isAddingUser
          ? "User created successfully!"
          : "User updated successfully!",
      });
      // Refetch users data
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message ||
        `Failed to ${
          isAddingUser ? "create" : "update"
        } user. Please try again.`;

      setErrorModal({
        open: true,
        message: errorMessage,
      });
    },
  });

  // Handle edit button click
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      mobile: user.mobile,
      personName: user.personName,
      baseLocationId: user.baseLocationId,
      vehicleNbr: user.vehicleNbr,
      roles: user.roles.map((role) => role.roleName),
    });
  };

  // Handle form input changes
  const handleFormChange = (field: string, value: any) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {
      personName:
        !editForm.personName.trim() || editForm.personName.trim().length > 25,
      mobile:
        !editForm.mobile.trim() || !/^\d{10}$/.test(editForm.mobile.trim()),
      baseLocationId: !editForm.baseLocationId,
      roles: editForm.roles.length === 0,
      vehicleNbr: editForm.vehicleNbr.length > 15,
    };

    setFormErrors(errors);

    // Return true if no errors
    return !Object.values(errors).some((error) => error);
  };

  // Handle form submission
  const handleSubmitUser = () => {
    // Set attempted submit flag for create flow
    if (isAddingUser) {
      setHasAttemptedSubmit(true);
    }

    if (!validateForm()) {
      return; // Don't submit if validation fails
    }

    if (editingUser) {
      // Update existing user
      userMutation.mutate({
        userData: editForm,
        isUpdate: true,
        userId: editingUser.id,
      });
    } else if (isAddingUser) {
      // Create new user
      userMutation.mutate({
        userData: editForm,
        isUpdate: false,
      });
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setEditingUser(null);
    setIsAddingUser(false);
    setEditForm({
      mobile: "",
      personName: "",
      baseLocationId: "",
      vehicleNbr: "",
      roles: [],
    });
    setFormErrors({
      personName: false,
      mobile: false,
      baseLocationId: false,
      roles: false,
      vehicleNbr: false,
    });
    setHasAttemptedSubmit(false);
  };

  // Handle error modal close
  const handleCloseErrorModal = () => {
    setErrorModal({
      open: false,
      message: "",
    });
  };

  // Handle success modal close
  const handleCloseSuccessModal = () => {
    setSuccessModal({
      open: false,
      message: "",
    });
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort users data
  const filteredAndSortedUsers = users
    ? [...users]
        .filter((user) => {
          if (!searchTerm) return true;

          const searchLower = searchTerm.toLowerCase();
          const searchableFields = [
            user.id,
            user.personName,
            user.baseLocationName,
            user.mobile,
            user.vehicleNbr,
            ...user.roles.map((role) => role.roleName),
          ];

          return searchableFields.some((field) =>
            field.toLowerCase().includes(searchLower)
          );
        })
        .sort((a, b) => {
          let aValue: string;
          let bValue: string;

          switch (sortField) {
            case "id":
              aValue = a.id;
              bValue = b.id;
              break;
            case "personName":
              aValue = a.personName;
              bValue = b.personName;
              break;
            case "baseLocationName":
              aValue = a.baseLocationName;
              bValue = b.baseLocationName;
              break;
            default:
              return 0;
          }

          if (sortDirection === "asc") {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        })
    : [];

  const isLoading = usersLoading || rolesLoading || locationsLoading;
  const isError = usersError || rolesError || locationsError;
  const error = usersErrorMsg || rolesErrorMsg || locationsErrorMsg;

  if (isLoading) {
    return (
      <ModalInfiniteSpinner
        condition={isLoading}
        title="Loading Users, Roles, and Locations..."
      />
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Error loading data:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1" color="primary">
          Users
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            setIsAddingUser(true);
            setEditingUser(null);
            setEditForm({
              mobile: "",
              personName: "",
              baseLocationId: "",
              vehicleNbr: "",
              roles: [],
            });
            setFormErrors({
              personName: false,
              mobile: false,
              baseLocationId: false,
              roles: false,
              vehicleNbr: false,
            });
            setHasAttemptedSubmit(false);
          }}
        >
          Add User
        </Button>
      </Box>

      {/* Search and Show Roles Row */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ width: "50%" }}>
          <TextField
            fullWidth
            placeholder="Search users by ID, name, location, mobile, vehicle number, or roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            autoComplete="off"
            InputProps={{
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setSearchTerm("")}
                    edge="end"
                    size="small"
                    sx={{ color: "text.secondary" }}
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <ToggleButton
          value="roles"
          selected={showRoles}
          onChange={() => setShowRoles(!showRoles)}
          size="small"
          sx={{
            px: 2,
            fontWeight: showRoles ? 600 : 400,
            backgroundColor: showRoles ? "primary.main" : "transparent",
            color: showRoles ? "white" : "primary.main",
            border: "1px solid",
            borderColor: "primary.main",
            "&:hover": {
              backgroundColor: showRoles ? "primary.dark" : "primary.light",
              color: "white",
            },
          }}
        >
          {showRoles ? "Hide Roles" : "Show Roles"}
        </ToggleButton>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            {/* Grouped header row */}
            <TableRow>
              <TableCell rowSpan={2}>
                <TableSortLabel
                  active={sortField === "id"}
                  direction={sortField === "id" ? sortDirection : "asc"}
                  onClick={() => handleSort("id")}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell rowSpan={2}>
                <TableSortLabel
                  active={sortField === "personName"}
                  direction={sortField === "personName" ? sortDirection : "asc"}
                  onClick={() => handleSort("personName")}
                >
                  Person Name
                </TableSortLabel>
              </TableCell>
              <TableCell rowSpan={2}>
                <TableSortLabel
                  active={sortField === "baseLocationName"}
                  direction={
                    sortField === "baseLocationName" ? sortDirection : "asc"
                  }
                  onClick={() => handleSort("baseLocationName")}
                >
                  Base Location
                </TableSortLabel>
              </TableCell>
              <TableCell rowSpan={2}>Mobile</TableCell>
              <TableCell rowSpan={2}>Vehicle Number</TableCell>
              <TableCell rowSpan={2}>Created At</TableCell>
              <TableCell rowSpan={2}>Active</TableCell>
              {showRoles && (
                <TableCell colSpan={allRoles?.length || 0} align="center">
                  Roles
                </TableCell>
              )}
            </TableRow>
            {/* Role names row */}
            {showRoles && (
              <TableRow>
                {allRoles?.map((role) => (
                  <TableCell key={role.roleName} align="center">
                    {role.roleName}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableHead>
          <TableBody>
            {filteredAndSortedUsers.map((user: User) => (
              <TableRow
                key={user.id}
                hover
                sx={{
                  "&:hover .edit-button": {
                    display: "inline-flex",
                  },
                  "& .edit-button": {
                    display: "none",
                  },
                }}
              >
                <TableCell sx={{ position: "relative" }}>
                  <Box sx={{ position: "relative", minHeight: "32px" }}>
                    <span>{user.id}</span>
                    <Button
                      className="edit-button"
                      size="small"
                      variant="contained"
                      startIcon={<Edit />}
                      onClick={() => handleEditClick(user)}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        minWidth: "auto",
                        px: 1,
                        zIndex: 1,
                        backgroundColor: "primary.main",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                </TableCell>
                <TableCell>{user.personName}</TableCell>
                <TableCell>{user.baseLocationName}</TableCell>
                <TableCell>{user.mobile}</TableCell>
                <TableCell>{user.vehicleNbr}</TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>{user.isActive ? "Yes" : "No"}</TableCell>
                {showRoles &&
                  allRoles?.map((role) => {
                    const hasRole = user.roles.some(
                      (userRole) => userRole.roleName === role.roleName
                    );
                    return (
                      <TableCell key={role.roleName} align="center">
                        {hasRole ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Cancel color="error" />
                        )}
                      </TableCell>
                    );
                  })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={!!editingUser || isAddingUser}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isAddingUser ? "Add User" : "Edit User"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Person Name"
              value={editForm.personName}
              onChange={(e) => {
                const value = e.target.value;
                handleFormChange("personName", value);

                // Real-time validation for person name
                const isValidPersonName =
                  value.trim().length > 0 && value.trim().length <= 25;
                setFormErrors((prev) => ({
                  ...prev,
                  personName: !isValidPersonName && value.length > 0,
                }));
              }}
              fullWidth
              error={
                isAddingUser
                  ? hasAttemptedSubmit && formErrors.personName
                  : formErrors.personName
              }
              required
              inputProps={{ maxLength: 25 }}
            />
            <TextField
              label="Mobile"
              value={editForm.mobile}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/[^0-9]/g, "")
                  .slice(0, 10);
                handleFormChange("mobile", value);

                // Real-time validation for mobile number
                const isValidMobile =
                  value.length === 10 && /^\d{10}$/.test(value);
                setFormErrors((prev) => ({
                  ...prev,
                  mobile: !isValidMobile && value.length > 0,
                }));
              }}
              fullWidth
              error={
                isAddingUser
                  ? hasAttemptedSubmit && formErrors.mobile
                  : formErrors.mobile
              }
              required
              inputProps={{ maxLength: 10 }}
              slotProps={{
                htmlInput: {
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                },
              }}
            />
            <FormControl
              fullWidth
              error={
                isAddingUser
                  ? hasAttemptedSubmit && formErrors.baseLocationId
                  : formErrors.baseLocationId
              }
              required
            >
              <InputLabel>Base Location</InputLabel>
              <Select
                value={editForm.baseLocationId}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFormChange("baseLocationId", value);

                  // Real-time validation for base location
                  const isValidBaseLocation = value.length > 0;
                  setFormErrors((prev) => ({
                    ...prev,
                    baseLocationId: !isValidBaseLocation && value.length > 0,
                  }));
                }}
                label="Base Location"
              >
                {baseLocations?.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Vehicle Number"
              value={editForm.vehicleNbr}
              onChange={(e) => handleFormChange("vehicleNbr", e.target.value)}
              fullWidth
              error={
                isAddingUser
                  ? hasAttemptedSubmit && formErrors.vehicleNbr
                  : formErrors.vehicleNbr
              }
              inputProps={{ maxLength: 15 }}
            />
            <FormControl
              fullWidth
              error={
                isAddingUser
                  ? hasAttemptedSubmit && formErrors.roles
                  : formErrors.roles
              }
              required
            >
              <InputLabel>Roles</InputLabel>
              <Select
                multiple
                value={editForm.roles}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFormChange("roles", value);

                  // Real-time validation for roles
                  const isValidRoles = Array.isArray(value) && value.length > 0;
                  setFormErrors((prev) => ({
                    ...prev,
                    roles: !isValidRoles && value.length > 0,
                  }));
                }}
                input={<OutlinedInput label="Roles" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {allRoles?.map((role) => (
                  <MenuItem key={role.roleName} value={role.roleName}>
                    <Checkbox
                      checked={editForm.roles.indexOf(role.roleName) > -1}
                    />
                    <ListItemText primary={role.roleName} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitUser}
            variant="contained"
            disabled={userMutation.isPending}
          >
            {userMutation.isPending
              ? isAddingUser
                ? "Creating..."
                : "Updating..."
              : isAddingUser
              ? "Create User"
              : "Update User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Spinner for User Operations */}
      <ModalInfiniteSpinner
        condition={userMutation.isPending}
        title={isAddingUser ? "Creating User..." : "Updating User..."}
      />

      {/* Error Modal */}
      <Dialog open={errorModal.open} onClose={handleCloseErrorModal}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography>{errorModal.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseErrorModal} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={successModal.open} onClose={handleCloseSuccessModal}>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <Typography>{successModal.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuccessModal} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AppUsers;
