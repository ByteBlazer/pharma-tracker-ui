import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Autocomplete,
  IconButton,
  Checkbox,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useApiService } from "../../hooks/useApiService";
import { API_ENDPOINTS } from "../../constants/GlobalConstants";
import {
  DeliveryReportResponse,
  DeliveryReportFilters,
} from "../../types/DeliveryReport";
import { DocStatus } from "../../types/DocStatus";
import { LightweightCustomer } from "../../types/LightweightCustomer";
import {
  AvailableDriversResponse,
  AvailableDriver,
} from "../../types/AvailableDriver";
import { BaseLocation } from "../../types/BaseLocation";

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

  // Build query string from filters - memoized to prevent recreation
  const buildQueryString = React.useCallback(
    (params: DeliveryReportFilters): string => {
      const queryParts: string[] = [];
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParts.push(`${key}=${encodeURIComponent(value)}`);
        }
      });
      return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    },
    []
  );

  // Create a stable query key from queryParams
  const queryKeyString = React.useMemo(() => {
    const sortedParams = Object.keys(queryParams)
      .sort()
      .map((key) => `${key}:${queryParams[key as keyof DeliveryReportFilters]}`)
      .join("|");
    return sortedParams;
  }, [
    queryParams.fromDate,
    queryParams.toDate,
    queryParams.docId,
    queryParams.customerId,
    queryParams.customerCity,
    queryParams.originWarehouse,
    queryParams.tripId,
    queryParams.driverUserId,
    queryParams.route,
    queryParams.tripStartLocation,
  ]);

  const queryKey = React.useMemo(
    () => ["delivery-report", queryKeyString],
    [queryKeyString]
  );

  // Fetch customers for city dropdown
  const { data: customersData } = useQuery<LightweightCustomer[]>({
    queryKey: ["customers-lightweight"],
    queryFn: () =>
      get<LightweightCustomer[]>(API_ENDPOINTS.CUSTOMERS_LIGHTWEIGHT),
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    refetchOnWindowFocus: false,
  });

  // Extract unique cities from customers data
  const cities = React.useMemo(() => {
    if (!customersData || customersData.length === 0) {
      return [];
    }
    const citySet = new Set<string>();
    customersData.forEach((customer) => {
      if (customer.city) {
        citySet.add(customer.city);
      }
    });
    return Array.from(citySet).sort();
  }, [customersData]);

  // Fetch routes from API
  const { data: routesData } = useQuery<string[]>({
    queryKey: ["routes"],
    queryFn: () => get<string[]>(API_ENDPOINTS.ROUTES),
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch origin warehouses from API
  const { data: originWarehousesData } = useQuery<string[]>({
    queryKey: ["origin-warehouses"],
    queryFn: () => get<string[]>(API_ENDPOINTS.ORIGIN_WAREHOUSES),
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch available drivers from API
  const { data: driversResponse } = useQuery<AvailableDriversResponse>({
    queryKey: ["available-drivers"],
    queryFn: () =>
      get<AvailableDriversResponse>(API_ENDPOINTS.AVAILABLE_DRIVERS),
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch base locations from API
  const { data: baseLocationsData } = useQuery<BaseLocation[]>({
    queryKey: ["base-locations"],
    queryFn: () => get<BaseLocation[]>(API_ENDPOINTS.BASE_LOCATIONS),
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch delivery report data
  const {
    data: reportData,
    isLoading,
    isFetching,
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
    staleTime: 0, // Always consider data stale to ensure refetch on filter change
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: true, // Refetch on component mount
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

  // Memoize specific onChange handlers to prevent TextField re-renders
  const handleFromDateChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilterChange("fromDate", e.target.value);
    },
    [handleFilterChange]
  );

  const handleToDateChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilterChange("toDate", e.target.value);
    },
    [handleFilterChange]
  );

  const handleDocIdChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilterChange("docId", e.target.value);
    },
    [handleFilterChange]
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

  // Memoize status color function
  const getStatusColor = React.useCallback((status: string) => {
    switch (status) {
      case DocStatus.DELIVERED:
        return "success";
      case DocStatus.UNDELIVERED:
        return "error";
      default:
        return "default";
    }
  }, []);

  // Memoize Doc ID InputProps to prevent unnecessary re-renders
  const docIdInputProps = React.useMemo(
    () => ({
      endAdornment: filters.docId ? (
        <IconButton
          size="small"
          onClick={() => handleFilterChange("docId", undefined)}
          sx={{ mr: -1 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : undefined,
    }),
    [filters.docId, handleFilterChange]
  );

  // Memoize Trip ID onChange handler
  const handleTripIdChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilterChange(
        "tripId",
        e.target.value ? parseInt(e.target.value, 10) : undefined
      );
    },
    [handleFilterChange]
  );

  // Memoize Trip ID InputProps to prevent unnecessary re-renders
  const tripIdInputProps = React.useMemo(
    () => ({
      endAdornment: filters.tripId ? (
        <IconButton
          size="small"
          onClick={() => handleFilterChange("tripId", undefined)}
          sx={{ mr: -1 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : undefined,
    }),
    [filters.tripId, handleFilterChange]
  );

  // Memoize format functions to prevent recreation on every render
  const formatDate = React.useCallback((dateString: string): string => {
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
  }, []);

  const formatDateTime = React.useCallback((dateString: string): string => {
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
  }, []);

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
            onChange={handleFromDateChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: filters.toDate || undefined }}
          />
          <TextField
            label="To Date"
            type="date"
            value={filters.toDate || ""}
            onChange={handleToDateChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: filters.fromDate || undefined }}
          />

          {/* Document Filters */}
          <TextField
            label="Doc ID"
            value={filters.docId || ""}
            onChange={handleDocIdChange}
            fullWidth
            autoComplete="off"
            InputProps={docIdInputProps}
          />
          <Autocomplete
            options={customersData || []}
            getOptionLabel={(option) =>
              option ? `${option.firmName} (${option.id})` : ""
            }
            value={
              customersData?.find((c) => c.id === filters.customerId) || null
            }
            onChange={(_, newValue) => {
              handleFilterChange("customerId", newValue?.id || undefined);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Customer" fullWidth />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options, { inputValue }) => {
              return options.filter(
                (option) =>
                  option.firmName
                    .toLowerCase()
                    .includes(inputValue.toLowerCase()) ||
                  option.id.toLowerCase().includes(inputValue.toLowerCase())
              );
            }}
            noOptionsText="No customers found"
            fullWidth
          />

          {/* Dropdown Filters */}
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={cities}
            value={
              filters.customerCity
                ? filters.customerCity.split(",").filter((c) => c.trim())
                : []
            }
            onChange={(_, newValue) => {
              handleFilterChange(
                "customerCity",
                newValue.length > 0 ? newValue.join(",") : undefined
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="Customer City" fullWidth />
            )}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox checked={selected} />
                {option}
              </li>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                />
              ))
            }
            noOptionsText="No cities found"
            fullWidth
          />

          <Autocomplete
            options={originWarehousesData || []}
            value={filters.originWarehouse || null}
            onChange={(_, newValue) => {
              handleFilterChange("originWarehouse", newValue || undefined);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Origin Warehouse" fullWidth />
            )}
            noOptionsText="No warehouses found"
            fullWidth
          />

          <Autocomplete
            options={routesData || []}
            value={filters.route || null}
            onChange={(_, newValue) => {
              handleFilterChange("route", newValue || undefined);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Route" fullWidth />
            )}
            noOptionsText="No routes found"
            fullWidth
          />

          {/* Trip Filters */}
          <TextField
            label="Trip ID"
            type="number"
            value={filters.tripId || ""}
            onChange={handleTripIdChange}
            fullWidth
            inputProps={{ min: 1 }}
            InputProps={tripIdInputProps}
          />

          <Autocomplete
            options={driversResponse?.drivers || []}
            getOptionLabel={(option) =>
              option ? `${option.driverName} - ${option.baseLocationName}` : ""
            }
            value={
              driversResponse?.drivers.find(
                (d: AvailableDriver) => d.userId === filters.driverUserId
              ) || null
            }
            onChange={(_, newValue) => {
              handleFilterChange("driverUserId", newValue?.userId || undefined);
            }}
            renderOption={(props, option) => (
              <Box
                component="li"
                {...props}
                sx={{
                  fontWeight: option.sameLocation ? "bold" : "normal",
                }}
              >
                {option.driverName} - {option.baseLocationName}
              </Box>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Driver" fullWidth />
            )}
            isOptionEqualToValue={(option, value) =>
              option.userId === value.userId
            }
            filterOptions={(options, { inputValue }) => {
              return options.filter(
                (option) =>
                  option.driverName
                    .toLowerCase()
                    .includes(inputValue.toLowerCase()) ||
                  option.baseLocationName
                    .toLowerCase()
                    .includes(inputValue.toLowerCase()) ||
                  option.userId.toLowerCase().includes(inputValue.toLowerCase())
              );
            }}
            noOptionsText="No drivers found"
            fullWidth
          />

          <Autocomplete
            options={baseLocationsData || []}
            getOptionLabel={(option) => (option ? option.name : "")}
            value={
              baseLocationsData?.find(
                (loc) => loc.id === filters.tripStartLocation
              ) || null
            }
            onChange={(_, newValue) => {
              handleFilterChange(
                "tripStartLocation",
                newValue?.id || undefined
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Original Trip Start Location"
                fullWidth
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options, { inputValue }) => {
              return options.filter((option) =>
                option.name.toLowerCase().includes(inputValue.toLowerCase())
              );
            }}
            noOptionsText="No locations found"
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
      {(isLoading || isFetching) && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            minHeight: "200px",
          }}
        >
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading report data...
          </Typography>
        </Box>
      )}

      {isError && !isFetching && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error
            ? error.message
            : "Failed to load delivery report data"}
        </Alert>
      )}

      {reportData && !isLoading && !isFetching && (
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
