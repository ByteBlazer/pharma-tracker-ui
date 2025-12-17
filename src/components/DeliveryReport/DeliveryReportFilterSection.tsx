import React from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  Autocomplete,
  IconButton,
  Chip,
  Checkbox,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { DeliveryReportFilters } from "../../types/DeliveryReport";
import { LightweightCustomer } from "../../types/LightweightCustomer";
import { AvailableDriver } from "../../types/AvailableDriver";
import { BaseLocation } from "../../types/BaseLocation";

interface DeliveryReportFilterSectionProps {
  filters: DeliveryReportFilters;
  validationError: string | null;
  customersData?: LightweightCustomer[];
  cities: string[];
  routesData?: string[];
  originWarehousesData?: string[];
  driversResponse?: { drivers: AvailableDriver[] };
  baseLocationsData?: BaseLocation[];
  onFilterChange: (key: keyof DeliveryReportFilters, value: any) => void;
  onSearch: () => void;
  onClear: () => void;
}

const DeliveryReportFilterSection: React.FC<
  DeliveryReportFilterSectionProps
> = ({
  filters,
  validationError,
  customersData,
  cities,
  routesData,
  originWarehousesData,
  driversResponse,
  baseLocationsData,
  onFilterChange,
  onSearch,
  onClear,
}) => {
  // Format date from YYYY-MM-DD to DD MMM YYYY (e.g., "10 Dec 2025")
  const formatDateForDisplay = React.useCallback(
    (dateString: string | undefined): string => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString + "T00:00:00"); // Add time to avoid timezone issues
        const day = date.getDate().toString().padStart(2, "0");
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
      } catch {
        return dateString;
      }
    },
    []
  );

  // Parse date from DD MMM YYYY format back to YYYY-MM-DD
  const parseDateFromDisplay = React.useCallback(
    (displayValue: string): string => {
      if (!displayValue) return "";
      try {
        // Try to parse formats like "10 Dec 2025" with various separators
        const parts = displayValue.trim().split(/[\s,\-./]+/);
        if (parts.length >= 3) {
          const day = parts[0].padStart(2, "0");
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const monthStr = parts[1].substring(0, 3);
          const monthIndex = monthNames.findIndex(
            (m) => m.toLowerCase() === monthStr.toLowerCase()
          );
          if (monthIndex !== -1) {
            const month = (monthIndex + 1).toString().padStart(2, "0");
            const year = parts[2];
            // Validate the date
            const date = new Date(`${year}-${month}-${day}T00:00:00`);
            if (
              !isNaN(date.getTime()) &&
              date.getDate() === parseInt(day) &&
              date.getMonth() === monthIndex &&
              date.getFullYear() === parseInt(year)
            ) {
              return `${year}-${month}-${day}`;
            }
          }
        }
        // If parsing fails, try to parse as ISO date (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(displayValue)) {
          const date = new Date(displayValue + "T00:00:00");
          if (!isNaN(date.getTime())) {
            return displayValue;
          }
        }
      } catch {
        // If all parsing fails, return empty string
      }
      return "";
    },
    []
  );

  const handleFromDateChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange("fromDate", e.target.value || undefined);
    },
    [onFilterChange]
  );

  const handleToDateChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange("toDate", e.target.value || undefined);
    },
    [onFilterChange]
  );

  // Refs for hidden date inputs
  const fromDateInputRef = React.useRef<HTMLInputElement>(null);
  const toDateInputRef = React.useRef<HTMLInputElement>(null);

  const handleFromDateDisplayClick = () => {
    fromDateInputRef.current?.showPicker?.();
  };

  const handleToDateDisplayClick = () => {
    toDateInputRef.current?.showPicker?.();
  };

  const handleDocIdChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange("docId", e.target.value);
    },
    [onFilterChange]
  );

  const handleTripIdChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange(
        "tripId",
        e.target.value ? parseInt(e.target.value, 10) : undefined
      );
    },
    [onFilterChange]
  );

  const docIdInputProps = React.useMemo(
    () => ({
      endAdornment: filters.docId ? (
        <IconButton
          size="small"
          onClick={() => onFilterChange("docId", undefined)}
          sx={{ mr: -1 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : undefined,
    }),
    [filters.docId, onFilterChange]
  );

  const tripIdInputProps = React.useMemo(
    () => ({
      endAdornment: filters.tripId ? (
        <IconButton
          size="small"
          onClick={() => onFilterChange("tripId", undefined)}
          sx={{ mr: -1 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : undefined,
    }),
    [filters.tripId, onFilterChange]
  );

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ mb: 1 }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Filters</h3>
      </Box>

      {validationError && (
        <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>
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
          gap: 1.5,
        }}
      >
        {/* Date Range */}
        <Box sx={{ position: "relative" }}>
          <TextField
            label="From Date"
            value={formatDateForDisplay(filters.fromDate)}
            onClick={handleFromDateDisplayClick}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            placeholder="Click to select date"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ cursor: "pointer" }}
          />
          <input
            ref={fromDateInputRef}
            type="date"
            value={filters.fromDate || ""}
            onChange={handleFromDateChange}
            max={filters.toDate || undefined}
            style={{
              position: "absolute",
              opacity: 0,
              pointerEvents: "none",
              width: 0,
              height: 0,
            }}
          />
        </Box>
        <Box sx={{ position: "relative" }}>
          <TextField
            label="To Date"
            value={formatDateForDisplay(filters.toDate)}
            onClick={handleToDateDisplayClick}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            placeholder="Click to select date"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ cursor: "pointer" }}
          />
          <input
            ref={toDateInputRef}
            type="date"
            value={filters.toDate || ""}
            onChange={handleToDateChange}
            min={filters.fromDate || undefined}
            style={{
              position: "absolute",
              opacity: 0,
              pointerEvents: "none",
              width: 0,
              height: 0,
            }}
          />
        </Box>

        {/* Document Filters */}
        <TextField
          label="Doc ID"
          value={filters.docId || ""}
          onChange={handleDocIdChange}
          fullWidth
          size="small"
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
            onFilterChange("customerId", newValue?.id || undefined);
          }}
          renderInput={(params) => (
            <TextField {...params} label="Customer" fullWidth size="small" />
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
            onFilterChange(
              "customerCity",
              newValue.length > 0 ? newValue.join(",") : undefined
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Customer City"
              fullWidth
              size="small"
            />
          )}
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox checked={selected} />
              {option}
            </li>
          )}
          renderTags={(value) => (
            <Chip
              variant="outlined"
              label={`${value.length} ${
                value.length === 1 ? "city" : "cities"
              } selected`}
              size="small"
            />
          )}
          noOptionsText="No cities found"
          fullWidth
        />

        <Autocomplete
          options={originWarehousesData || []}
          value={filters.originWarehouse || null}
          onChange={(_, newValue) => {
            onFilterChange("originWarehouse", newValue || undefined);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Origin Warehouse"
              fullWidth
              size="small"
            />
          )}
          noOptionsText="No warehouses found"
          fullWidth
        />

        <Autocomplete
          options={routesData || []}
          value={filters.route || null}
          onChange={(_, newValue) => {
            onFilterChange("route", newValue || undefined);
          }}
          renderInput={(params) => (
            <TextField {...params} label="Route" fullWidth size="small" />
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
          size="small"
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
            onFilterChange("driverUserId", newValue?.userId || undefined);
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
            <TextField {...params} label="Driver" fullWidth size="small" />
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
            onFilterChange("tripStartLocation", newValue?.id || undefined);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Parent Trip Originated From"
              fullWidth
              size="small"
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
            size="small"
            startIcon={<SearchIcon />}
            onClick={onSearch}
            disabled={!!validationError}
            fullWidth
          >
            Search
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={onClear}
            fullWidth
          >
            Clear
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default DeliveryReportFilterSection;
