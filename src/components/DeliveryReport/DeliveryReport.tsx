import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiService } from "../../hooks/useApiService";
import { API_ENDPOINTS } from "../../constants/GlobalConstants";
import {
  DeliveryReportResponse,
  DeliveryReportFilters,
} from "../../types/DeliveryReport";
import { DocStatus } from "../../types/DocStatus";
import { LightweightCustomer } from "../../types/LightweightCustomer";
import { AvailableDriversResponse } from "../../types/AvailableDriver";
import { BaseLocation } from "../../types/BaseLocation";
import DeliveryReportFilterSection from "./DeliveryReportFilterSection";
import DeliveryReportDataDisplaySection from "./DeliveryReportDataDisplaySection";

interface DeliveryReportProps {
  onBack?: () => void;
}

const DeliveryReport: React.FC<DeliveryReportProps> = ({ onBack }) => {
  const { get } = useApiService();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DeliveryReportFilters>({});
  const [queryParams, setQueryParams] = useState<DeliveryReportFilters>({});
  const [hasSearched, setHasSearched] = useState(false);

  // Reset state when component first mounts
  React.useEffect(() => {
    setFilters({});
    setQueryParams({});
    setHasSearched(false);
    queryClient.removeQueries({ queryKey: ["delivery-report"] });
  }, [queryClient]);

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
  const queryKey = React.useMemo(() => {
    const sortedParams = Object.keys(queryParams)
      .sort()
      .map((key) => `${key}:${queryParams[key as keyof DeliveryReportFilters]}`)
      .join("|");
    return ["delivery-report", sortedParams];
  }, [queryParams]);

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
    enabled: hasSearched,
    staleTime: 0, // Always consider data stale to ensure refetch on filter change
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount - wait for user to search
  });

  // Validate date range - memoized to avoid recalculation on every render
  const validationError = React.useMemo((): string | null => {
    const hasFromDate = !!filters.fromDate;
    const hasToDate = !!filters.toDate;

    // Both must be provided or both must be blank
    if (hasFromDate && !hasToDate) {
      return "To Date is required when From Date is provided";
    }

    if (!hasFromDate && hasToDate) {
      return "From Date is required when To Date is provided";
    }

    // If both are provided, validate that From date <= To date and range <= 30 days
    if (hasFromDate && hasToDate && filters.fromDate && filters.toDate) {
      const from = new Date(filters.fromDate);
      const to = new Date(filters.toDate);

      if (from > to) {
        return "From date cannot be after To date";
      }

      // Check 30-day limit
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 30) {
        return "Date range cannot exceed 30 days";
      }
    }

    return null;
  }, [filters.fromDate, filters.toDate]);

  const handleFilterChange = (key: keyof DeliveryReportFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleSearch = () => {
    if (validationError) {
      return;
    }
    setQueryParams({ ...filters });
    setHasSearched(true);
  };

  const handleClear = () => {
    const clearedFilters: DeliveryReportFilters = {};
    setFilters(clearedFilters);
    setQueryParams({});
    setHasSearched(false);
    // Clear query cache when clearing filters
    queryClient.removeQueries({ queryKey: ["delivery-report"] });
  };

  const handleBack = () => {
    setFilters({});
    setQueryParams({});
    setHasSearched(false);
    queryClient.removeQueries({ queryKey: ["delivery-report"] });
    onBack?.();
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
          gap: 1.5,
          mb: 1.5,
        }}
      >
        {onBack && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ minWidth: "auto" }}
          >
            Back to Reports
          </Button>
        )}
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          Delivery Report
        </Typography>
      </Box>

      {/* Filters Section */}
      <DeliveryReportFilterSection
        filters={filters}
        validationError={validationError}
        customersData={customersData}
        cities={cities}
        routesData={routesData}
        originWarehousesData={originWarehousesData}
        driversResponse={driversResponse}
        baseLocationsData={baseLocationsData}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onClear={handleClear}
      />

      {/* Results Section */}
      <DeliveryReportDataDisplaySection
        reportData={reportData}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={error}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        getStatusColor={getStatusColor}
        show30DayMessage={
          !filters.fromDate &&
          !filters.toDate &&
          (!filters.docId || filters.docId.length < 3) &&
          !filters.customerId
        }
      />
    </Box>
  );
};

export default DeliveryReport;
