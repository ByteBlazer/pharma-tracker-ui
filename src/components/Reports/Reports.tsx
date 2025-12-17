import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
} from "@mui/material";
import { LocalShipping as DeliveryReportIcon } from "@mui/icons-material";
import DeliveryReport from "../DeliveryReport/DeliveryReport";

type ReportType = "delivery" | null;

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);

  const reports = [
    {
      id: "delivery" as ReportType,
      title: "Delivery Report",
      description:
        "View delivery status reports for documents with DELIVERED or UNDELIVERED status",
      icon: <DeliveryReportIcon sx={{ fontSize: 48, color: "primary.main" }} />,
    },
  ];

  if (selectedReport === "delivery") {
    return <DeliveryReport onBack={() => setSelectedReport(null)} />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Reports
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Select a report to view detailed information and analytics.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
        }}
      >
        {reports.map((report) => (
          <Card
            key={report.id}
            sx={{
              height: "100%",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 4,
              },
            }}
          >
            <CardActionArea
              onClick={() => setSelectedReport(report.id)}
              sx={{ height: "100%", p: 2 }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <Box sx={{ mb: 2 }}>{report.icon}</Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                  {report.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {report.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default Reports;
