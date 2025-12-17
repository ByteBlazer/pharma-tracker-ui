import React from "react";
import {
  Box,
  Typography,
  Paper,
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
import { DeliveryReportResponse } from "../../types/DeliveryReport";
import { DocStatus } from "../../types/DocStatus";

interface DataDisplaySectionProps {
  reportData?: DeliveryReportResponse;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  formatDate: (dateString: string) => string;
  formatDateTime: (dateString: string) => string;
  getStatusColor: (status: string) => "success" | "error" | "default";
}

const DataDisplaySection: React.FC<DataDisplaySectionProps> = ({
  reportData,
  isLoading,
  isFetching,
  isError,
  error,
  formatDate,
  formatDateTime,
  getStatusColor,
}) => {
  return (
    <>
      {/* Loading State */}
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

      {/* Error State */}
      {isError && !isFetching && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error
            ? error.message
            : "Failed to load delivery report data"}
        </Alert>
      )}

      {/* Results */}
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
    </>
  );
};

// Memoize the component to prevent re-renders when filters change
export default React.memo(DataDisplaySection, (prevProps, nextProps) => {
  // Only re-render if data-related props change
  return (
    prevProps.reportData === nextProps.reportData &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isFetching === nextProps.isFetching &&
    prevProps.isError === nextProps.isError &&
    prevProps.error === nextProps.error
  );
});
