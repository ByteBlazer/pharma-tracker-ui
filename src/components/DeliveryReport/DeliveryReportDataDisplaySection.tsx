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
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { DeliveryReportResponse } from "../../types/DeliveryReport";
import { DocStatus } from "../../types/DocStatus";

interface DeliveryReportDataDisplaySectionProps {
  reportData?: DeliveryReportResponse;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  formatDate: (dateString: string) => string;
  formatDateTime: (dateString: string) => string;
  getStatusColor: (status: string) => "success" | "error" | "default";
}

const DeliveryReportDataDisplaySection: React.FC<
  DeliveryReportDataDisplaySectionProps
> = ({
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
            <Paper sx={{ overflow: "visible" }}>
              <Table sx={{ minWidth: 650 }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        position: "sticky",
                        top: 64,
                        backgroundColor: "background.paper",
                        zIndex: 10,
                        boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong>Doc ID</strong>
                    </TableCell>
                    <TableCell
                      sx={{
                        position: "sticky",
                        top: 64,
                        backgroundColor: "background.paper",
                        zIndex: 10,
                        boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell
                      sx={{
                        position: "sticky",
                        top: 64,
                        backgroundColor: "background.paper",
                        zIndex: 10,
                        boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong>Customer</strong>
                    </TableCell>
                    <TableCell
                      sx={{
                        position: "sticky",
                        top: 64,
                        backgroundColor: "background.paper",
                        zIndex: 10,
                        boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong>City</strong>
                    </TableCell>
                    <TableCell
                      sx={{
                        position: "sticky",
                        top: 64,
                        backgroundColor: "background.paper",
                        zIndex: 10,
                        boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong>Doc Date</strong>
                    </TableCell>
                    <TableCell
                      sx={{
                        position: "sticky",
                        top: 64,
                        backgroundColor: "background.paper",
                        zIndex: 10,
                        boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong>Trip ID</strong>
                    </TableCell>
                    <TableCell
                      sx={{
                        position: "sticky",
                        top: 64,
                        backgroundColor: "background.paper",
                        zIndex: 10,
                        boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong>Driver</strong>
                    </TableCell>
                    <TableCell
                      sx={{
                        position: "sticky",
                        top: 64,
                        backgroundColor: "background.paper",
                        zIndex: 10,
                        boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong>Vehicle</strong>
                    </TableCell>
                    <TableCell
                      sx={{
                        position: "sticky",
                        top: 64,
                        backgroundColor: "background.paper",
                        zIndex: 10,
                        boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong>Route</strong>
                    </TableCell>
                    <TableCell
                      sx={{
                        position: "sticky",
                        top: 64,
                        backgroundColor: "background.paper",
                        zIndex: 10,
                        boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong>Origin Warehouse</strong>
                    </TableCell>
                    <TableCell
                      sx={{
                        position: "sticky",
                        top: 64,
                        backgroundColor: "background.paper",
                        zIndex: 10,
                        boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong>Created By</strong>
                    </TableCell>
                    <TableCell
                      sx={{
                        position: "sticky",
                        top: 64,
                        backgroundColor: "background.paper",
                        zIndex: 10,
                        boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                      }}
                    >
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
            </Paper>
          )}
        </Box>
      )}
    </>
  );
};

// Memoize the component to prevent re-renders when filters change
export default React.memo(
  DeliveryReportDataDisplaySection,
  (prevProps, nextProps) => {
    // Only re-render if data-related props change
    return (
      prevProps.reportData === nextProps.reportData &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.isFetching === nextProps.isFetching &&
      prevProps.isError === nextProps.isError &&
      prevProps.error === nextProps.error
    );
  }
);
