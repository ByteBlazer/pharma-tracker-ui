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
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Edit, Clear } from "@mui/icons-material";
import { useState } from "react";
import { useApiService } from "../../hooks/useApiService";
import { BaseLocation } from "../../types/BaseLocation";
import { API_ENDPOINTS } from "../../constants/GlobalConstants";
import ModalInfiniteSpinner from "../ModalInfiniteSpinner/ModalInfiniteSpinner";

type SortField = "id" | "name";
type SortDirection = "asc" | "desc";

function BaseLocations() {
  const { getBaseLocations, post, put } = useApiService();
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [editingLocation, setEditingLocation] = useState<BaseLocation | null>(
    null
  );
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: false,
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

  // Fetch base locations using TanStack React Query with JWT token
  const {
    data: baseLocations,
    isLoading: locationsLoading,
    isError: locationsError,
    error: locationsErrorMsg,
  } = useQuery<BaseLocation[]>({
    queryKey: ["base-locations"],
    queryFn: getBaseLocations,
  });

  // Create/Update location mutation
  const locationMutation = useMutation({
    mutationFn: ({
      locationData,
      isUpdate,
      locationId,
    }: {
      locationData: any;
      isUpdate: boolean;
      locationId?: string;
    }) => {
      if (isUpdate && locationId) {
        return put(
          API_ENDPOINTS.UPDATE_BASE_LOCATION(locationId),
          locationData
        );
      } else {
        return post(API_ENDPOINTS.BASE_LOCATIONS, locationData);
      }
    },
    onSuccess: () => {
      setEditingLocation(null);
      setIsAddingLocation(false);
      setSuccessModal({
        open: true,
        message: isAddingLocation
          ? "Base location created successfully!"
          : "Base location updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["base-locations"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message ||
        `Failed to ${
          isAddingLocation ? "create" : "update"
        } base location. Please try again.`;
      setErrorModal({
        open: true,
        message: errorMessage,
      });
    },
  });

  // Handle edit button click
  const handleEditClick = (location: BaseLocation) => {
    setEditingLocation(location);
    setEditForm({
      name: location.name,
    });
    setFormErrors({
      name: false,
    });
    setHasAttemptedSubmit(false);
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
      name: !editForm.name.trim() || editForm.name.trim().length > 50,
    };
    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  // Handle form submission
  const handleSubmitLocation = () => {
    if (isAddingLocation) {
      setHasAttemptedSubmit(true);
    }
    if (!validateForm()) {
      return;
    }
    if (editingLocation) {
      locationMutation.mutate({
        locationData: editForm,
        isUpdate: true,
        locationId: editingLocation.id,
      });
    } else if (isAddingLocation) {
      locationMutation.mutate({
        locationData: editForm,
        isUpdate: false,
      });
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setEditingLocation(null);
    setIsAddingLocation(false);
    setEditForm({
      name: "",
    });
    setFormErrors({
      name: false,
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

  // Filter and sort locations data
  const filteredAndSortedLocations = baseLocations
    ? [...baseLocations]
        .filter((location) => {
          if (!searchTerm) return true;
          const searchLower = searchTerm.toLowerCase();
          const searchableFields = [location.id, location.name];
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
            case "name":
              aValue = a.name;
              bValue = b.name;
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

  const isLoading = locationsLoading;
  const isError = locationsError;
  const error = locationsErrorMsg;

  if (isLoading) {
    return (
      <ModalInfiniteSpinner
        condition={isLoading}
        title="Loading Base Locations..."
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
          Base Locations
        </Typography>
      </Box>

      {/* Search and Add Button Row */}
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
            placeholder="Search base locations by ID or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
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
        <Button
          variant="contained"
          onClick={() => {
            setIsAddingLocation(true);
            setEditingLocation(null);
            setEditForm({
              name: "",
            });
            setFormErrors({
              name: false,
            });
            setHasAttemptedSubmit(false);
          }}
        >
          Add Base Location
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === "id"}
                  direction={sortField === "id" ? sortDirection : "asc"}
                  onClick={() => handleSort("id")}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === "name"}
                  direction={sortField === "name" ? sortDirection : "asc"}
                  onClick={() => handleSort("name")}
                >
                  Name
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedLocations.map((location: BaseLocation) => (
              <TableRow
                key={location.id}
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
                    <span>{location.id}</span>
                    <Button
                      className="edit-button"
                      size="small"
                      variant="contained"
                      startIcon={<Edit />}
                      onClick={() => handleEditClick(location)}
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
                <TableCell>{location.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Location Dialog */}
      <Dialog
        open={!!editingLocation || isAddingLocation}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isAddingLocation ? "Add Base Location" : "Edit Base Location"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              value={editForm.name}
              onChange={(e) => {
                const value = e.target.value;
                handleFormChange("name", value);
                const isValidName =
                  value.trim().length > 0 && value.trim().length <= 50;
                setFormErrors((prev) => ({
                  ...prev,
                  name: !isValidName && value.length > 0,
                }));
              }}
              fullWidth
              error={
                isAddingLocation
                  ? hasAttemptedSubmit && formErrors.name
                  : formErrors.name
              }
              required
              inputProps={{ maxLength: 50 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitLocation}
            variant="contained"
            disabled={locationMutation.isPending}
          >
            {locationMutation.isPending
              ? isAddingLocation
                ? "Creating..."
                : "Updating..."
              : isAddingLocation
              ? "Create Base Location"
              : "Update Base Location"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Spinner for Location Operations */}
      <ModalInfiniteSpinner
        condition={locationMutation.isPending}
        title={
          isAddingLocation
            ? "Creating Base Location..."
            : "Updating Base Location..."
        }
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

export default BaseLocations;
