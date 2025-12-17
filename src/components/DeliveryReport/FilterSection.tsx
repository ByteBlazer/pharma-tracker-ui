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
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { DeliveryReportFilters } from "../../types/DeliveryReport";
import { LightweightCustomer } from "../../types/LightweightCustomer";
import { AvailableDriver } from "../../types/AvailableDriver";
import { BaseLocation } from "../../types/BaseLocation";

interface FilterSectionProps {
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

const FilterSection: React.FC<FilterSectionProps> = ({
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
  const handleFromDateChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange("fromDate", e.target.value);
    },
    [onFilterChange]
  );

  const handleToDateChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange("toDate", e.target.value);
    },
    [onFilterChange]
  );

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
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ mb: 2 }}>
        <h2>Filters</h2>
      </Box>

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
            onFilterChange("customerId", newValue?.id || undefined);
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
            onFilterChange(
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
            onFilterChange("originWarehouse", newValue || undefined);
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
            onFilterChange("route", newValue || undefined);
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
            onFilterChange("tripStartLocation", newValue?.id || undefined);
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
            onClick={onSearch}
            disabled={!!validationError}
            fullWidth
          >
            Search
          </Button>
          <Button
            variant="outlined"
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

export default FilterSection;
