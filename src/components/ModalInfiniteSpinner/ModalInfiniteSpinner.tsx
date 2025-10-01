import { Box, CircularProgress, Modal } from "@mui/material";

function ModalInfiniteSpinner({
  condition,
  title = "Please wait...",
}: {
  condition: boolean;
  title?: string;
}) {
  return (
    <Modal
      open={condition}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClose={(event, reason) => {
        // Prevent closing during API calls
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return; // Don't close
        }
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          p: 2,
          bgcolor: "background.paper",
          outline: "none",
          border: "none",
          borderRadius: "0.5rem",
          boxShadow: 24,
        }}
      >
        <CircularProgress />
        <div style={{ fontSize: "0.9rem", fontWeight: "500" }}>{title}</div>
      </Box>
    </Modal>
  );
}

export default ModalInfiniteSpinner;
