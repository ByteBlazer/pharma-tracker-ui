import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Link,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";
import { DeliveryReportResponse } from "../../types/DeliveryReport";
import { DocStatus } from "../../types/DocStatus";
import { SignatureResponse } from "../../types/SignatureResponse";
import { useApiService } from "../../hooks/useApiService";
import { API_ENDPOINTS } from "../../constants/GlobalConstants";

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
  const { get } = useApiService();
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<SignatureResponse | null>(
    null
  );
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string>("");
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [currentComment, setCurrentComment] = useState<string>("");
  const [currentCommentDocId, setCurrentCommentDocId] = useState<string>("");
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const tableScrollRef = React.useRef<HTMLDivElement>(null);

  const handleViewSignature = async (docId: string) => {
    setCurrentDocId(docId);
    setSignatureModalOpen(true);
    setSignatureLoading(true);
    setSignatureError(null);
    setSignatureData(null);

    try {
      const response = await get<SignatureResponse>(
        API_ENDPOINTS.DOC_SIGNATURE(docId)
      );
      setSignatureData(response);
    } catch (err) {
      setSignatureError(
        err instanceof Error ? err.message : "Failed to load signature"
      );
    } finally {
      setSignatureLoading(false);
    }
  };

  const handleCloseSignatureModal = () => {
    setSignatureModalOpen(false);
    setSignatureData(null);
    setSignatureError(null);
    setCurrentDocId("");
  };

  const handleDownloadSignature = () => {
    if (!signatureData?.signature) return;

    // Create a link element and trigger download
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${signatureData.signature}`;
    link.download = `signature_${currentDocId}_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewComment = (docId: string, comment: string) => {
    setCurrentCommentDocId(docId);
    setCurrentComment(comment || "No comment available");
    setCommentModalOpen(true);
  };

  const handleCloseCommentModal = () => {
    setCommentModalOpen(false);
    setCurrentComment("");
    setCurrentCommentDocId("");
  };

  // Sync scroll positions
  const handleTopScroll = () => {
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  // Sync the top scrollbar width with table width
  useEffect(() => {
    if (tableScrollRef.current && topScrollRef.current) {
      const syncWidth = () => {
        if (tableScrollRef.current && topScrollRef.current) {
          const tableWidth = tableScrollRef.current.scrollWidth;
          topScrollRef.current.style.width = `${tableScrollRef.current.clientWidth}px`;
          const innerBox = topScrollRef.current.querySelector("div");
          if (innerBox) {
            innerBox.style.width = `${tableWidth}px`;
          }
        }
      };
      syncWidth();
      window.addEventListener("resize", syncWidth);
      return () => window.removeEventListener("resize", syncWidth);
    }
  }, [reportData]);

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
            <Paper>
              {/* Top scrollbar */}
              <Box
                ref={topScrollRef}
                onScroll={handleTopScroll}
                sx={{
                  overflowX: "auto",
                  overflowY: "hidden",
                  height: "20px",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  direction: "ltr",
                }}
              >
                <Box sx={{ minWidth: "650px", height: "1px" }} />
              </Box>
              {/* Table container */}
              <TableContainer
                ref={tableScrollRef}
                onScroll={handleTableScroll}
                sx={{
                  overflowX: "auto",
                  maxHeight: "calc(100vh - 475px)",
                  overflowY: "auto",
                }}
              >
                <Table sx={{ minWidth: 650 }} size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          position: "sticky",
                          top: 0,
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
                          top: 0,
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
                          top: 0,
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
                          top: 0,
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
                          top: 0,
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
                          top: 0,
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
                          top: 0,
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
                          top: 0,
                          backgroundColor: "background.paper",
                          zIndex: 10,
                          boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                        }}
                      >
                        <strong>Trip Creator</strong>
                      </TableCell>
                      <TableCell
                        sx={{
                          position: "sticky",
                          top: 0,
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
                          top: 0,
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
                          top: 0,
                          backgroundColor: "background.paper",
                          zIndex: 10,
                          boxShadow: "0 2px 2px -1px rgba(0,0,0,0.1)",
                        }}
                      >
                        <strong>Origin Warehouse</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.data.map((row) => (
                      <TableRow key={row.docId} hover>
                        <TableCell>{row.docId}</TableCell>
                        <TableCell>{formatDate(row.docDate)}</TableCell>
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
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.5,
                            }}
                          >
                            <Chip
                              label={
                                row.status === DocStatus.UNDELIVERED
                                  ? "DELIVERY FAILED"
                                  : row.status
                              }
                              color={getStatusColor(row.status) as any}
                              size="small"
                            />
                            {row.status === DocStatus.DELIVERED && (
                              <Link
                                component="button"
                                variant="caption"
                                onClick={() => handleViewSignature(row.docId)}
                                sx={{
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                  fontSize: "0.75rem",
                                }}
                              >
                                View Signature
                              </Link>
                            )}
                            {row.status === DocStatus.UNDELIVERED && (
                              <Link
                                component="button"
                                variant="caption"
                                onClick={() =>
                                  handleViewComment(row.docId, row.comment)
                                }
                                sx={{
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                  fontSize: "0.75rem",
                                }}
                              >
                                View Comment
                              </Link>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{row.tripId}</TableCell>
                        <TableCell>{row.route || "-"}</TableCell>
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
                        <TableCell>{row.driverName || "-"}</TableCell>
                        <TableCell>{row.vehicleNbr || "-"}</TableCell>
                        <TableCell>{row.originWarehouse || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      )}

      {/* Signature Modal */}
      <Dialog
        open={signatureModalOpen}
        onClose={handleCloseSignatureModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Signature - {currentDocId}</DialogTitle>
        <DialogContent>
          {signatureLoading && (
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
                Loading signature...
              </Typography>
            </Box>
          )}

          {signatureError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {signatureError}
            </Alert>
          )}

          {signatureData && !signatureLoading && (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 2,
                  backgroundColor: "background.default",
                }}
              >
                <img
                  src={`data:image/png;base64,${signatureData.signature}`}
                  alt="Signature"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "400px",
                    objectFit: "contain",
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Signature Timestamp:</strong>{" "}
                {formatDateTime(signatureData.lastUpdatedAt)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSignatureModal}>Close</Button>
          {signatureData && !signatureLoading && (
            <Button
              onClick={handleDownloadSignature}
              variant="contained"
              startIcon={<DownloadIcon />}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Comment Modal */}
      <Dialog
        open={commentModalOpen}
        onClose={handleCloseCommentModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Comment - {currentCommentDocId}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
            {currentComment}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCommentModal}>Close</Button>
        </DialogActions>
      </Dialog>
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
