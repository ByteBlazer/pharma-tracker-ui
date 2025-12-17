import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useApiService } from "../../hooks/useApiService";
import { API_ENDPOINTS } from "../../constants/GlobalConstants";
import {
  DeliveryReportResponse,
  DeliveryReportFilters,
} from "../../types/DeliveryReport";
import { DocStatus } from "../../types/DocStatus";

interface DeliveryReportProps {
  onBack?: () => void;
}

const DeliveryReport: React.FC<DeliveryReportProps> = ({ onBack }) => {
  const { get } = useApiService();
  const [filters, setFilters] = useState<DeliveryReportFilters>({});
  const [queryParams, setQueryParams] = useState<DeliveryReportFilters>({});

  // Calculate default date range (last 7 days)
  const getDefaultDateRange = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    return {
      fromDate: sevenDaysAgo.toISOString().split("T")[0],
      toDate: today.toISOString().split("T")[0],
    };
  };

  // Initialize with default date range
  React.useEffect(() => {
    const defaultRange = getDefaultDateRange();
    setFilters({
      fromDate: defaultRange.fromDate,
      toDate: defaultRange.toDate,
    });
    setQueryParams({
      fromDate: defaultRange.fromDate,
      toDate: defaultRange.toDate,
    });
  }, []);

  // Build query string from filters
  const buildQueryString = (params: DeliveryReportFilters): string => {
    const queryParts: string[] = [];
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParts.push(`${key}=${encodeURIComponent(value)}`);
      }
    });
    return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  };

  // Create a stable query key from queryParams
  const queryKey = React.useMemo(() => {
    const sortedParams = Object.keys(queryParams)
      .sort()
      .map((key) => `${key}:${queryParams[key as keyof DeliveryReportFilters]}`)
      .join("|");
    return ["delivery-report", sortedParams];
  }, [queryParams]);

  // Fetch delivery report data
  const {
    data: reportData,
    isLoading,
    isError,
    error,
  } = useQuery<DeliveryReportResponse>({
    queryKey,
    queryFn: () => {
      const queryString = buildQueryString(queryParams);
      return get<DeliveryReportResponse>(
        `${API_ENDPOINTS.DELIVERY_REPORT}${queryString}`
      );
    },
    enabled: Object.keys(queryParams).length > 0,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

  // Validate date range (max 30 days) - memoized to avoid recalculation on every render
  const validationError = React.useMemo((): string | null => {
    if (!filters.fromDate || !filters.toDate) return null;

    const from = new Date(filters.fromDate);
    const to = new Date(filters.toDate);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      return "Date range cannot exceed 30 days";
    }

    if (from > to) {
      return "From date cannot be after To date";
    }

    return null;
  }, [filters.fromDate, filters.toDate]);

  // Memoize filter change handler to prevent unnecessary re-renders
  const handleFilterChange = React.useCallback(
    (key: keyof DeliveryReportFilters, value: any) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value || undefined,
      }));
    },
    []
  );

  const handleSearch = () => {
    if (validationError) {
      return;
    }
    setQueryParams({ ...filters });
  };

  const handleClear = () => {
    const defaultRange = getDefaultDateRange();
    const clearedFilters: DeliveryReportFilters = {
      fromDate: defaultRange.fromDate,
      toDate: defaultRange.toDate,
    };
    setFilters(clearedFilters);
    setQueryParams(clearedFilters);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case DocStatus.DELIVERED:
        return "success";
      case DocStatus.UNDELIVERED:
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Asia/Kolkata",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
    } catch {
      return dateString;
    }
  };

  // Extract unique values for dropdowns from report data
  // Only process if we have data and limit processing to avoid blocking UI
  const uniqueValues = useMemo(() => {
    if (!reportData?.data || reportData.data.length === 0) {
      return {
        cities: [],
        routes: [],
        warehouses: [],
      };
    }

    // Use a more efficient approach - process in chunks if needed
    const cities = new Set<string>();
    const routes = new Set<string>();
    const warehouses = new Set<string>();

    // Process data efficiently
    for (let i = 0; i < reportData.data.length; i++) {
      const item = reportData.data[i];
      if (item.city) cities.add(item.city);
      if (item.route) routes.add(item.route);
      if (item.originWarehouse) warehouses.add(item.originWarehouse);
    }

    return {
      cities: Array.from(cities).sort(),
      routes: Array.from(routes).sort(),
      warehouses: Array.from(warehouses).sort(),
    };
  }, [reportData?.data]); // Only depend on the data array, not the whole reportData object

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        {onBack && (
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ minWidth: "auto" }}
          >
            Back to Reports
          </Button>
        )}
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Delivery Report
        </Typography>
      </Box>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filters
        </Typography>

        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {/* Date Range */}
          <TextField
            label="From Date"
            type="date"
            value={filters.fromDate || ""}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: filters.toDate || undefined }}
          />
          <TextField
            label="To Date"
            type="date"
            value={filters.toDate || ""}
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: filters.fromDate || undefined }}
          />

          {/* Document Filters */}
          <TextField
            label="Doc ID"
            value={filters.docId || ""}
            onChange={(e) => handleFilterChange("docId", e.target.value)}
            fullWidth
          />
          <TextField
            label="Customer ID"
            value={filters.customerId || ""}
            onChange={(e) => handleFilterChange("customerId", e.target.value)}
            fullWidth
          />

          {/* Dropdown Filters */}
          <FormControl fullWidth>
            <InputLabel>Customer City</InputLabel>
            <Select
              value={filters.customerCity || ""}
              onChange={(e) =>
                handleFilterChange("customerCity", e.target.value)
              }
              label="Customer City"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>All Cities</em>
              </MenuItem>
              {uniqueValues.cities.map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Origin Warehouse</InputLabel>
            <Select
              value={filters.originWarehouse || ""}
              onChange={(e) =>
                handleFilterChange("originWarehouse", e.target.value)
              }
              label="Origin Warehouse"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>All Warehouses</em>
              </MenuItem>
              {uniqueValues.warehouses.map((warehouse) => (
                <MenuItem key={warehouse} value={warehouse}>
                  {warehouse}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Route</InputLabel>
            <Select
              value={filters.route || ""}
              onChange={(e) => handleFilterChange("route", e.target.value)}
              label="Route"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>All Routes</em>
              </MenuItem>
              {uniqueValues.routes.map((route) => (
                <MenuItem key={route} value={route}>
                  {route}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Trip Filters */}
          <TextField
            label="Trip ID"
            type="number"
            value={filters.tripId || ""}
            onChange={(e) =>
              handleFilterChange(
                "tripId",
                e.target.value ? parseInt(e.target.value, 10) : undefined
              )
            }
            fullWidth
            inputProps={{ min: 1 }}
          />

          <TextField
            label="Driver User ID"
            value={filters.driverUserId || ""}
            onChange={(e) => handleFilterChange("driverUserId", e.target.value)}
            fullWidth
          />

          <TextField
            label="Trip Start Location"
            value={filters.tripStartLocation || ""}
            onChange={(e) =>
              handleFilterChange("tripStartLocation", e.target.value)
            }
            fullWidth
          />

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={!!validationError}
              fullWidth
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              fullWidth
            >
              Clear
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Results Section */}
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error
            ? error.message
            : "Failed to load delivery report data"}
        </Alert>
      )}

      {reportData && !isLoading && (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">
              Results: {reportData.totalRecords} records
            </Typography>
          </Box>

          {reportData.data.length === 0 ? (
            <Alert severity="info">
              No records found for the selected filters.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Doc ID</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Customer</strong>
                    </TableCell>
                    <TableCell>
                      <strong>City</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Doc Date</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Trip ID</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Driver</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Vehicle</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Route</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Origin Warehouse</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Created By</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Last Updated</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.data.map((row) => (
                    <TableRow key={row.docId} hover>
                      <TableCell>{row.docId}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            row.status === DocStatus.UNDELIVERED
                              ? "DELIVERY FAILED"
                              : row.status
                          }
                          color={getStatusColor(row.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            {row.firmName || "-"}
                          </Typography>
                          {row.address && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {row.address}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{row.city || "-"}</TableCell>
                      <TableCell>{formatDate(row.docDate)}</TableCell>
                      <TableCell>{row.tripId}</TableCell>
                      <TableCell>{row.driverName || "-"}</TableCell>
                      <TableCell>{row.vehicleNbr || "-"}</TableCell>
                      <TableCell>{row.route || "-"}</TableCell>
                      <TableCell>{row.originWarehouse || "-"}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {row.createdByPersonName || "-"}
                          </Typography>
                          {row.createdByLocation && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {row.createdByLocation}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{formatDateTime(row.lastUpdatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DeliveryReport;
