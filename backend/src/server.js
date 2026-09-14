require("dotenv").config();

const express = require("express");
const cors = require("cors");
const prisma = require("./prisma");
const shipmentRoutes = require("./routes/shipments");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");
const { generateReport } = require("../utils/reportGenerator");
const { generateReportEmailHtml } = require("../utils/reportEmail");
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 5000;

const resend = new Resend(process.env.RESEND_API_KEY);

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
    })
);
app.use(express.json());

app.use("/api/shipments", shipmentRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Inbound Management API is running",
    });
});

app.get("/api/shipments", async (req, res) => {
    try {
        const shipments = await prisma.shipment.findMany({
            orderBy: {
            id: "asc",
            },
        });

        res.json(shipments);
    } catch (error) {
        console.error("Error fetching shipments:", error);

        res.status(500).json({
            message: "Failed to fetch shipments",
        });
    }
});

app.get("/api/shipments/export", async (req, res) => {
    try {
        const shipments = await prisma.shipment.findMany({
            orderBy: {
                id: "asc",
            },
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Inbound Shipments");

        worksheet.views = [
            {
                state: "frozen",
                ySplit: 2,
            },
        ];

        worksheet.addRow([
            "No",
            "Agents",
            "BL Number",
            "Invoice No",
            "Vessel Name",
            "Containers",
            "Units",
            "Arrival Estimation",
            "Arrival at Yard",
            "PIB Clearance Date",
            "PIB",
            null,
            null,
            null,
        ]);

        worksheet.addRow([
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "BM",
            "PPN",
            "PPh",
            "Total PIB Payment",
        ]);

        worksheet.mergeCells("A1:A2");
        worksheet.mergeCells("B1:B2");
        worksheet.mergeCells("C1:C2");
        worksheet.mergeCells("D1:D2");
        worksheet.mergeCells("E1:E2");
        worksheet.mergeCells("F1:F2");
        worksheet.mergeCells("G1:G2");
        worksheet.mergeCells("H1:H2");
        worksheet.mergeCells("I1:I2");
        worksheet.mergeCells("J1:J2");
        worksheet.mergeCells("K1:N1");

        worksheet.getRow(2).height = 30;

        shipments.forEach((shipment, index) => {
            worksheet.addRow([
                index + 1,
                shipment.agent || "",
                shipment.blNumber || "",
                shipment.invoiceNumber || "",
                shipment.vesselName || "",
                shipment.containers ?? "",
                shipment.units ?? "",
                shipment.arrivalEstimation
                    ? new Date(shipment.arrivalEstimation)
                    : "",
                shipment.arrivalAtYard
                    ? new Date(shipment.arrivalAtYard)
                    : "",
                shipment.pibClearanceDate
                    ? new Date(shipment.pibClearanceDate)
                    : "",
                shipment.bm !== null ? Number(shipment.bm) : "",
                shipment.ppn !== null ? Number(shipment.ppn) : "",
                shipment.pph !== null ? Number(shipment.pph) : "",
                shipment.totalPibPayment !== null
                    ? Number(shipment.totalPibPayment)
                    : "",
            ]);
        });

        // Apply Aptos Narrow, 11pt to every cell
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.font = {
                    name: "Aptos Narrow",
                    size: 11,
                };
            });
        });

        for (let row = 1; row <= 2; row++) {
            worksheet.getRow(row).eachCell((cell) => {
                cell.font = {
                    ...cell.font,
                    bold: true,
                };
        
                cell.alignment = {
                    horizontal: "center",
                    vertical: "middle",
                    wrapText: true,
                };
            });

            for (let col = 1; col <= 9; col++) {
                worksheet.getCell(row, col).fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: "FFFF00",
                    },
                };
            }

            worksheet.getCell(row, 10).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                    argb: "D9D9D9",
                },
            };

            for (let col = 11; col <= 13; col++) {
                worksheet.getCell(row, col).fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: "D0D0D0",
                    },
                };
            }

            if (row === 2) {
                worksheet.getCell(row, 14).fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: "ADADAD",
                    },
                };
            }
        }

        for (let row = 1; row <= worksheet.rowCount; row++) {
            for (let col = 1; col <= 14; col++) {
                const cell = worksheet.getCell(row, col);
        
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            }
        }

        for (let col = 1; col <= 14; col++) {
            worksheet.getCell(2, col).border = {
                ...worksheet.getCell(2, col).border,
                bottom: { style: "medium" },
            };
        }

        for (let row = 3; row <= worksheet.rowCount; row++) {
            for (let col = 1; col <= 9; col++) {
                worksheet.getCell(row, col).fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: "DAF2D0",
                    },
                };
            }

            worksheet.getCell(row, 10).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                    argb: "D9D9D9",
                },
            };

            for (let col = 11; col <= 13; col++) {
                worksheet.getCell(row, col).fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: "D0D0D0",
                    },
                };
            }

            worksheet.getCell(row, 14).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                    argb: "ADADAD",
                },
            };
        
            // Date formatting
            worksheet.getCell(`H${row}`).numFmt = "dd/mm/yyyy";
            worksheet.getCell(`I${row}`).numFmt = "dd/mm/yyyy";
            worksheet.getCell(`J${row}`).numFmt = "dd/mm/yyyy";
        
            worksheet.getCell(`H${row}`).alignment = {
                horizontal: "center",
                vertical: "middle",
            };
        
            worksheet.getCell(`I${row}`).alignment = {
                horizontal: "center",
                vertical: "middle",
            };
        
            worksheet.getCell(`J${row}`).alignment = {
                horizontal: "center",
                vertical: "middle",
            };
        
            // Payment number formatting
            worksheet.getCell(`K${row}`).numFmt = "#,##0;-#,##0;-";
            worksheet.getCell(`L${row}`).numFmt = "#,##0;-#,##0;-";
            worksheet.getCell(`M${row}`).numFmt = "#,##0;-#,##0;-";
            worksheet.getCell(`N${row}`).numFmt = "#,##0;-#,##0;-";
        }

        // Column widths
        worksheet.columns = [
            { width: 4 },   // No
            { width: 11.5 },  // Agents
            { width: 20 },  // BL Number
            { width: 23.5 },  // Invoice No
            { width: 28 },  // Vessel Name
            { width: 11.5 },  // Containers
            { width: 6 },  // Units
            { width: 17 },  // Arrival Estimation
            { width: 14 },  // Arrival at Yard
            { width: 19 },  // PIB Clearance Date
            { width: 14.5 },  // BM
            { width: 14.5 },  // PPN
            { width: 14.5 },  // PPh
            { width: 14.5 },  // Total PIB Payment
        ];

        const excelBuffer = await workbook.xlsx.writeBuffer();

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Inbound Shipments.xlsx"'
        );

        res.send(Buffer.from(excelBuffer));
    } catch (error) {
        console.error("Error exporting shipments:", error);

        res.status(500).json({
            message: "Failed to export shipments",
        });
    }
});

app.get("/api/dashboard", async (req, res) => {
    try {
        const totalShipments = await prisma.shipment.count();

        const totalContainers = await prisma.shipment.aggregate({
            _sum: {
                containers: true,
            },
        });

        const totalUnits = await prisma.shipment.aggregate({
            _sum: {
                units: true,
            },
        });

        const shipmentsArrived = await prisma.shipment.count({
            where: {
                arrivalAtYard: {
                    not: null,
                },
            },
        });

        const shipmentsInProgress = await prisma.shipment.count({
            where: {
                arrivalAtYard: null,
            },
        });

        const shipmentsCleared = await prisma.shipment.count({
            where: {
                pibClearanceDate: {
                    not: null,
                },
            },
        });

        const shipmentsPendingCompletion = await prisma.shipment.count({
            where: {
                arrivalAtYard: {
                    not: null,
                },
                NOT: {
                    agent: { not: null },
                    blNumber: { not: null },
                    invoiceNumber: { not: null },
                    vesselName: { not: null },
                    containers: { not: null },
                    units: { not: null },
                    arrivalEstimation: { not: null },
                    arrivalAtYard: { not: null },
                    pibClearanceDate: { not: null },
                    bm: { not: null },
                    ppn: { not: null },
                    totalPibPayment: {
                        gt: 0,
                    },
                },
            },
        });

        const shipmentsCompleted = await prisma.shipment.count({
            where: {
                agent: { not: null },
                blNumber: { not: null },
                invoiceNumber: { not: null },
                vesselName: { not: null },
                containers: { not: null },
                units: { not: null },
                arrivalEstimation: { not: null },
                arrivalAtYard: { not: null },
                pibClearanceDate: { not: null },
                bm: { not: null },
                ppn: { not: null },
                totalPibPayment: { gt: 0 },
            },
        });

        res.json({
            totalShipments,
            totalContainers: totalContainers._sum.containers || 0,
            totalUnits: totalUnits._sum.units || 0,
            shipmentsArrived,
            shipmentsInProgress,
            shipmentsPendingCompletion,
            shipmentsCleared,
            shipmentsCompleted,
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);

        res.status(500).json({
            message: "Failed to fetch dashboard data",
        });
    }
});

app.get("/api/dashboard/upcoming", async (req, res) => {
    try {
        const shipments = await prisma.shipment.findMany({
            where: {
                arrivalEstimation: {
                    not: null,
                },
                arrivalAtYard: null,
            },
            orderBy: {
                arrivalEstimation: "asc",
            },
            take: 5,
        });

        res.json(shipments);
    } catch (error) {
        console.error("Error fetching pending arrivals:", error);

        res.status(500).json({
            message: "Failed to fetch pending arrivals",
        });
    }
});

app.get("/api/reports/summary", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const shipments = await prisma.shipment.findMany({
            where: {
                ...(startDate || endDate
                    ? {
                        arrivalEstimation: {
                            ...(startDate
                                ? {
                                    gte: new Date(`${startDate}T00:00:00Z`),
                                }
                                : {}),
                            ...(endDate
                                ? {
                                    lte: new Date(`${endDate}T23:59:59.999Z`),
                                }
                                : {}),
                        },
                    }
                    : {}),
            },

            select: {
                containers: true,
                units: true,
            },
        });

        const summary = shipments.reduce(
            (result, shipment) => {
                result.shipments += 1;
                result.containers += shipment.containers || 0;
                result.units += shipment.units || 0;

                return result;
            },
            {
                shipments: 0,
                containers: 0,
                units: 0,
            }
        );

        res.json(summary);
    } catch (error) {
        console.error("Error fetching report summary:", error);

        res.status(500).json({
            message: "Failed to fetch report summary",
        });
    }
});

app.get("/api/reports/agents", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const shipments = await prisma.shipment.findMany({
            where: {
                ...(startDate || endDate
                    ? {
                        arrivalEstimation: {
                            ...(startDate
                                ? { gte: new Date(`${startDate}T00:00:00Z`) }
                                : {}),
                            ...(endDate
                                ? { lte: new Date(`${endDate}T23:59:59.999Z`) }
                                : {}),
                        },
                        }
                    : {}),
            },
          
            select: {
                agent: true,
                containers: true,
                units: true,
                bm: true,
                ppn: true,
                pph: true,
                totalPibPayment: true,
            },
        });

        const agentMap = {};

        for (const shipment of shipments) {
            const agent = shipment.agent || "-";

            if (!agentMap[agent]) {
                agentMap[agent] = {
                    agent,
                    shipments: 0,
                    containers: 0,
                    units: 0,
                    bm: 0,
                    ppn: 0,
                    pph: 0,
                    totalPibPayment: 0,
                };
            }

            agentMap[agent].shipments += 1;
            agentMap[agent].containers += shipment.containers || 0;
            agentMap[agent].units += shipment.units || 0;
            agentMap[agent].bm += Number(shipment.bm || 0);
            agentMap[agent].ppn += Number(shipment.ppn || 0);
            agentMap[agent].pph += Number(shipment.pph || 0);
            agentMap[agent].totalPibPayment += Number(
                shipment.totalPibPayment || 0
            );
        }

        res.json(Object.values(agentMap));
    } catch (error) {
        console.error("Error fetching agent report:", error);

        res.status(500).json({
            message: "Failed to fetch agent report",
        });
    }
});

app.get("/api/reports/payments", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const shipments = await prisma.shipment.findMany({
            where: {
                ...(startDate || endDate
                    ? {
                        arrivalEstimation: {
                        ...(startDate
                            ? {
                                gte: new Date(`${startDate}T00:00:00Z`),
                            }
                            : {}),
                        ...(endDate
                            ? {
                                lte: new Date(`${endDate}T23:59:59.999Z`),
                            }
                            : {}),
                        },
                    }
                    : {}),
            },

            select: {
                bm: true,
                ppn: true,
                pph: true,
                totalPibPayment: true,
            },
        });

        const totals = shipments.reduce(
            (result, shipment) => {
                result.bm += Number(shipment.bm || 0);
                result.ppn += Number(shipment.ppn || 0);
                result.pph += Number(shipment.pph || 0);
                result.totalPibPayment += Number(
                    shipment.totalPibPayment || 0
                );

                return result;
            },
            {
                bm: 0,
                ppn: 0,
                pph: 0,
                totalPibPayment: 0,
            }
        );

        res.json(totals);
    } catch (error) {
        console.error("Error fetching payment report:", error);

        res.status(500).json({
            message: "Failed to fetch payment report",
        });
    }
});

app.get("/api/report-recipients/active", async (req, res) => {
    try {
        const recipients = await prisma.reportRecipient.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        res.json(recipients);
    } catch (error) {
        console.error(
            "Error fetching active report recipients:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch active report recipients",
        });
    }
});

app.get("/api/report-recipients", async (req, res) => {
    try {
        const recipients = await prisma.reportRecipient.findMany({
            orderBy: {
                name: "asc",
            },
        });

        res.json(recipients);
    } catch (error) {
        console.error("Error fetching report recipients:", error);

        res.status(500).json({
            message: "Failed to fetch report recipients",
        });
    }
});

app.post("/api/report-recipients", async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name?.trim() || !email?.trim()) {
            return res.status(400).json({
                message: "Name and email are required.",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                message: "Please enter a valid email address.",
            });
        }

        const recipient = await prisma.reportRecipient.create({
            data: {
                name: name.trim(),
                email: email.trim(),
            },
        });

        res.status(201).json({
            message: "Report recipient added successfully.",
            recipient,
        });
    } catch (error) {
        console.error("Error adding report recipient:", error);

        if (error.code === "P2002") {
            return res.status(409).json({
                message: "A recipient with this email already exists.",
            });
        }

        res.status(500).json({
            message: "Failed to add report recipient.",
        });
    }
});

app.put("/api/report-recipients/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, isActive } = req.body;

        if (
            !name?.trim() ||
            !email?.trim() ||
            typeof isActive !== "boolean"
        ) {
            return res.status(400).json({
                message: "Name, email, and isActive are required.",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                message: "Please enter a valid email address.",
            });
        }

        const recipient = await prisma.reportRecipient.update({
            where: {
                id: Number(id),
            },
            data: {
                name: name.trim(),
                email: email.trim(),
                isActive,
            },
        });

        res.json({
            message: "Report recipient updated successfully.",
            recipient,
        });
    } catch (error) {
        console.error("Error updating report recipient:", error);

        if (error.code === "P2025") {
            return res.status(404).json({
                message: "Report recipient not found.",
            });
        }

        if (error.code === "P2002") {
            return res.status(409).json({
                message: "A recipient with this email already exists.",
            });
        }

        res.status(500).json({
            message: "Failed to update report recipient.",
        });
    }
});

app.post("/api/reports/send", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const { recipientIds } = req.body;

        if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
            return res.status(400).json({
                error: "Please select at least one recipient.",
            });
        }

        const recipients = await prisma.reportRecipient.findMany({
            where: {
                id: {
                    in: recipientIds,
                },
                isActive: true,
            },
        });

        if (recipients.length === 0) {
            return res.status(400).json({
                error: "No active recipients were found.",
            });
        }

        const recipientEmails = recipients.map(
            (recipient) => recipient.email
        );

        const report = await generateReport(
            prisma,
            startDate,
            endDate
        );

        const emailHtml = generateReportEmailHtml(
            report,
            startDate,
            endDate
        );

        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL,
            to: recipientEmails,
            subject: "Inbound Shipment Report",
            html: emailHtml,
        });

        if (error) {
            console.error("Resend error:", error);

            return res.status(500).json({
                error: "Failed to send report email.",
            });
        }

        console.log("Selected recipient IDs:", recipientIds);
        console.log("Report email sent successfully.");

        res.json({
            message: "Report email sent successfully.",
            emailId: data.id,
        });
    } catch (error) {
        console.error("Error sending report:", error);

        res.status(500).json({
            error: "Failed to send report email.",
        });
    }
});

app.get("/api/reports/preview", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const report = await generateReport(
            prisma,
            startDate,
            endDate
        );

        const emailHtml = generateReportEmailHtml(
            report,
            startDate,
            endDate
        );

        res.type("html").send(emailHtml);
    } catch (error) {
        console.error("Error previewing report:", error);

        res.status(500).send(
            "Failed to generate report preview."
        );
    }
});

app.get("/api/shipments/:id", async (req, res) => {
    try {
        const shipment = await prisma.shipment.findUnique({
            where: {
                id: Number(req.params.id),
            },
        });

        if (!shipment) {
            return res.status(404).json({
                message: "Shipment not found",
            });
        }

        res.json(shipment);
    } catch (error) {
    console.error("Error fetching shipment:", error);

    res.status(500).json({
        message: "Failed to fetch shipment",
    });
    }
});

app.post("/api/shipments", async (req, res) => {
    try {
        const {
            agent,
            blNumber,
            invoiceNumber,
            vesselName,
            containers,
            arrivalEstimation,
            arrivalAtYard,
            pibClearanceDate,
            bm,
            ppn,
            pph,
        } = req.body;

        if (!blNumber?.trim() || !invoiceNumber?.trim() || !vesselName?.trim()) {
            return res.status(400).json({
                message: "BL Number, Invoice Number, and Vessel Name are required.",
            });
        }

        const existingShipment = await prisma.shipment.findFirst({
            where: {
                blNumber: blNumber.trim(),
                invoiceNumber: invoiceNumber.trim(),
            },
        });
        
        if (existingShipment) {
            return res.status(409).json({
                message: "A shipment with this BL Number and Invoice Number already exists.",
            });
        }

        const containersValue =
            containers === "" ||
            containers === null ||
            containers === undefined
            ? null
            : Number(containers);

        const unitsValue =
            containersValue !== null
            ? containersValue * 2
            : null;

        const bmValue =
            bm === "" ||
            bm === null ||
            bm === undefined
            ? null
            : Number(bm);

        const ppnValue =
            ppn === "" ||
            ppn === null ||
            ppn === undefined
            ? null
            : Number(ppn);

        const pphValue =
            pph === "" ||
            pph === null ||
            pph === undefined
            ? 0
            : Number(pph);

        const numericValues = {
            containers: containersValue,
            bm: bmValue,
            ppn: ppnValue,
            pph: pphValue,
        };
        
        for (const [field, value] of Object.entries(numericValues)) {
            if (value !== null && (!Number.isFinite(value) || value < 0)) {
                return res.status(400).json({
                    message: `${field} must be a non-negative number.`,
                });
            }
        }

        const totalPibPaymentValue =
            (bmValue ?? 0) + (ppnValue ?? 0) + pphValue;

        const shipment = await prisma.shipment.create({
            data: {
                agent: agent || null,
                blNumber: blNumber || null,
                invoiceNumber: invoiceNumber || null,
                vesselName: vesselName || null,

                containers: containersValue,
                units: unitsValue,

                arrivalEstimation: arrivalEstimation
                    ? new Date(`${arrivalEstimation}T00:00:00Z`)
                    : null,

                arrivalAtYard: arrivalAtYard
                    ? new Date(`${arrivalAtYard}T00:00:00Z`)
                    : null,

                pibClearanceDate: pibClearanceDate
                    ? new Date(`${pibClearanceDate}T00:00:00Z`)
                    : null,

                bm: bmValue,
                ppn: ppnValue,
                pph: pphValue,
                totalPibPayment: totalPibPaymentValue,
            },
        });

        const totalShipments = await prisma.shipment.count();

        const shipmentsPerPage = 20;
        const page = Math.ceil(totalShipments / shipmentsPerPage);

        res.status(201).json({
            message: "Shipment created successfully",
            shipment,
            page,
        });
    } catch (error) {
        console.error("Error creating shipment:", error);

        res.status(500).json({
            message: "Failed to create shipment",
        });
    }
});

app.put("/api/shipments/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            agent,
            blNumber,
            invoiceNumber,
            vesselName,
            containers,
            arrivalEstimation,
            arrivalAtYard,
            pibClearanceDate,
            bm,
            ppn,
            pph,
        } = req.body;

        if (!blNumber?.trim() || !invoiceNumber?.trim() || !vesselName?.trim()) {
            return res.status(400).json({
                message: "BL Number, Invoice Number, and Vessel Name are required.",
            });
        }

        const existingShipment = await prisma.shipment.findFirst({
            where: {
                id: {
                    not: Number(id),
                },
                blNumber: blNumber.trim(),
                invoiceNumber: invoiceNumber.trim(),
            },
        });
        
        if (existingShipment) {
            return res.status(409).json({
                message: "A shipment with this BL Number and Invoice Number already exists.",
            });
        }

        const containersValue =
            containers === "" || containers === null || containers === undefined
            ? null
            : Number(containers);

        const unitsValue =
            containersValue !== null
            ? containersValue * 2
            : null;

        const bmValue =
            bm === "" || bm === null || bm === undefined
            ? null
            : Number(bm);

        const ppnValue =
            ppn === "" || ppn === null || ppn === undefined
            ? null
            : Number(ppn);

        const pphValue =
            pph === "" || pph === null || pph === undefined
            ? 0
            : Number(pph);

        const numericValues = {
            containers: containersValue,
            bm: bmValue,
            ppn: ppnValue,
            pph: pphValue,
        };
        
        for (const [field, value] of Object.entries(numericValues)) {
            if (value !== null && (!Number.isFinite(value) || value < 0)) {
                return res.status(400).json({
                    message: `${field} must be a non-negative number.`,
                });
            }
        }

        const totalPibPaymentValue =
            (bmValue ?? 0) + (ppnValue ?? 0) + pphValue;

        const shipment = await prisma.shipment.update({
            where: {
                id: Number(id),
            },
            data: {
                agent: agent || null,
                blNumber: blNumber || null,
                invoiceNumber: invoiceNumber || null,
                vesselName: vesselName || null,
                containers: containersValue,
                units: unitsValue,

                arrivalEstimation: arrivalEstimation
                    ? new Date(`${arrivalEstimation}T00:00:00Z`)
                    : null,

                arrivalAtYard: arrivalAtYard
                    ? new Date(`${arrivalAtYard}T00:00:00Z`)
                    : null,

                pibClearanceDate: pibClearanceDate
                    ? new Date(`${pibClearanceDate}T00:00:00Z`)
                    : null,

                bm: bmValue,
                ppn: ppnValue,
                pph: pphValue,
                totalPibPayment: totalPibPaymentValue,
            },
        });

        res.json({
            message: "Shipment updated successfully",
            shipment,
        });
    } catch (error) {
        console.error("Error updating shipment:", error);

        res.status(500).json({
            message: "Failed to update shipment",
        });
    }
});

app.delete("/api/shipments/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const shipment = await prisma.shipment.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!shipment) {
            return res.status(404).json({
                message: "Shipment not found",
            });
        }

        await prisma.shipment.delete({
            where: {
                id: Number(id),
            },
        });

        res.json({
            message: "Shipment deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting shipment:", error);

        res.status(500).json({
            message: "Failed to delete shipment",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});