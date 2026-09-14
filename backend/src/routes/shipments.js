const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const prisma = require("../prisma");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
});

function parseDate(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (typeof value === "number") {
        const parsed = XLSX.SSF.parse_date_code(value);

        if (!parsed) {
            return null;
        }

        return new Date(
            Date.UTC(parsed.y, parsed.m - 1, parsed.d)
        );
    }

    if (typeof value === "string") {
        const [day, month, year] = value.split("/").map(Number);

        return new Date(
            Date.UTC(year, month - 1, day)
        );
    }

    return null;
}

function parseNumber(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (typeof value === "number") {
        return value;
    }

    return Number(String(value).replace(/\./g, ""));
}

function normalizeText(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    return value;
}

function shipmentsAreEqual(existing, incoming) {
    return (
        normalizeText(existing.agent) ===
            normalizeText(incoming.agent) &&

        normalizeText(existing.blNumber) ===
            normalizeText(incoming.blNumber) &&

        normalizeText(existing.invoiceNumber) ===
            normalizeText(incoming.invoiceNumber) &&

        normalizeText(existing.vesselName) ===
            normalizeText(incoming.vesselName) &&

        existing.containers === incoming.containers &&

        existing.units === incoming.units &&

        existing.arrivalEstimation?.getTime() ===
            incoming.arrivalEstimation?.getTime() &&

        existing.arrivalAtYard?.getTime() ===
            incoming.arrivalAtYard?.getTime() &&

        existing.pibClearanceDate?.getTime() ===
            incoming.pibClearanceDate?.getTime() &&

        Number(existing.bm) === Number(incoming.bm) &&

        Number(existing.ppn) === Number(incoming.ppn) &&

        Number(existing.pph) === Number(incoming.pph) &&

        Number(existing.totalPibPayment) ===
            Number(incoming.totalPibPayment)
    );
}

router.post("/import", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "No Excel file uploaded",
        });
    }

    try {
        const workbook = XLSX.read(req.file.buffer, {
            type: "buffer",
            cellDates: false,
        });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: null,
        });

        const headerRow1 = rows[0] || [];
        const headerRow2 = rows[1] || [];

        const normalizeHeader = (value) =>
            String(value ?? "")
                .trim()
                .replace(/\s+/g, " ")
                .toLowerCase();

        const headersMatch =
            normalizeHeader(headerRow1[0]) === "no" &&
            normalizeHeader(headerRow1[1]) === "agents" &&
            normalizeHeader(headerRow1[2]) === "bl number" &&
            normalizeHeader(headerRow1[3]) === "invoice no" &&
            normalizeHeader(headerRow1[4]) === "vessel name" &&
            normalizeHeader(headerRow1[5]) === "containers" &&
            normalizeHeader(headerRow1[6]) === "units" &&
            normalizeHeader(headerRow1[7]) === "arrival estimation" &&
            normalizeHeader(headerRow1[8]) === "arrival at yard" &&
            normalizeHeader(headerRow1[9]) === "pib clearance date" &&
            normalizeHeader(headerRow1[10]) === "pib" &&
            normalizeHeader(headerRow2[10]) === "bm" &&
            normalizeHeader(headerRow2[11]) === "ppn" &&
            normalizeHeader(headerRow2[12]) === "pph" &&
            normalizeHeader(headerRow2[13]) === "total pib payment";

        if (!headersMatch) {
            return res.status(400).json({
                message:
                    "Invalid Excel format. Please upload the expected Inbound Shipment Excel file.",
            });
        }

        const shipmentRows = rows
            .slice(2)
            .filter((row) =>
                row.some(
                    (value) =>
                        value !== null &&
                        value !== ""
                )
            );

        const shipments = shipmentRows.map((row) => ({
            agent: normalizeText(row[1]),
            blNumber: normalizeText(row[2]),
            invoiceNumber: normalizeText(row[3]),
            vesselName: normalizeText(row[4]),
            containers: parseNumber(row[5]),
            units: parseNumber(row[6]),
            arrivalEstimation: parseDate(row[7]),
            arrivalAtYard: parseDate(row[8]),
            pibClearanceDate: parseDate(row[9]),
            bm: parseNumber(row[10]),
            ppn: parseNumber(row[11]),
            pph: parseNumber(row[12]),
            totalPibPayment: parseNumber(row[13]),
        }));

        const validationErrors = [];

        for (const shipment of shipments) {
            const hasContainers =
                shipment.containers !== null;

            const hasUnits =
                shipment.units !== null;

            const hasBm =
                shipment.bm !== null;

            const hasPpn =
                shipment.ppn !== null;

            const hasPph =
                shipment.pph !== null;

            const hasTotalPib =
                shipment.totalPibPayment !== null;

            // Containers and Units must be filled together
            if (hasContainers !== hasUnits) {
                validationErrors.push({
                    blNumber: shipment.blNumber,
                    invoiceNumber: shipment.invoiceNumber,
                    message:
                        "Containers and Units must both be filled.",
                    details:
                        `Containers: ${
                            shipment.containers ?? "empty"
                        }, Units: ${
                            shipment.units ?? "empty"
                        }`,
                });
            }

            // Units must equal Containers × 2
            if (
                hasContainers &&
                hasUnits &&
                shipment.units !== shipment.containers * 2
            ) {
                validationErrors.push({
                    blNumber: shipment.blNumber,
                    invoiceNumber: shipment.invoiceNumber,
                    message:
                        "Units must equal Containers × 2.",
                    details:
                        `Containers: ${shipment.containers}, ` +
                        `Units: ${shipment.units}`,
                });
            }

            // BM, PPN, and Total must all be filled
            // when any PIB payment information is provided.
            const hasAnyPibPayment =
                (shipment.bm ?? 0) !== 0 ||
                (shipment.ppn ?? 0) !== 0 ||
                (shipment.pph ?? 0) !== 0 ||
                (shipment.totalPibPayment ?? 0) !== 0;

            if (hasAnyPibPayment) {
                if (!hasBm || !hasPpn || !hasTotalPib) {
                    validationErrors.push({
                        blNumber: shipment.blNumber,
                        invoiceNumber: shipment.invoiceNumber,
                        message:
                            "BM, PPN, and Total PIB Payment must all be filled when PIB payment information is provided.",
                        details:
                            `BM: ${shipment.bm ?? "empty"}, ` +
                            `PPN: ${shipment.ppn ?? "empty"}, ` +
                            `PPh: ${shipment.pph ?? "empty"}, ` +
                            `Total: ${
                                shipment.totalPibPayment ?? "empty"
                            }`,
                    });
                }
            }

            // Total PIB Payment must equal BM + PPN + PPh.
            // Empty PPh is treated as 0.
            if (
                hasBm &&
                hasPpn &&
                hasTotalPib
            ) {
                const expectedTotal =
                    shipment.bm +
                    shipment.ppn +
                    (shipment.pph ?? 0);

                if (
                    shipment.totalPibPayment !==
                    expectedTotal
                ) {
                    validationErrors.push({
                        blNumber: shipment.blNumber,
                        invoiceNumber: shipment.invoiceNumber,
                        message:
                            "Total PIB Payment must equal BM + PPN + PPh.",
                        details:
                            `BM: ${shipment.bm}, ` +
                            `PPN: ${shipment.ppn}, ` +
                            `PPh: ${
                                shipment.pph ?? "empty"
                            }, ` +
                            `Total: ${shipment.totalPibPayment}, ` +
                            `Expected: ${expectedTotal}`,
                    });
                }
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: "Excel contains invalid shipment data.",
                errors: validationErrors,
            });
        }

        const existingShipments =
            await prisma.shipment.findMany({
                where: {
                    OR: shipments.map((shipment) => ({
                        blNumber: shipment.blNumber,
                        invoiceNumber:
                            shipment.invoiceNumber,
                    })),
                },
            });

        const existingShipmentMap = new Map(
            existingShipments.map((shipment) => [
                `${shipment.blNumber}|${shipment.invoiceNumber}`,
                shipment,
            ])
        );

        let added = 0;
        let updated = 0;
        let skipped = 0;

        for (const shipment of shipments) {
            const key =
                `${shipment.blNumber}|${shipment.invoiceNumber}`;

            const existingShipment =
                existingShipmentMap.get(key);

            // Shipment does not exist yet
            if (!existingShipment) {
                const createdShipment =
                    await prisma.shipment.create({
                        data: shipment,
                    });

                existingShipmentMap.set(
                    key,
                    createdShipment
                );

                added++;

                continue;
            }

            // Shipment exists and all values are identical
            if (
                shipmentsAreEqual(
                    existingShipment,
                    shipment
                )
            ) {
                skipped++;

                continue;
            }

            // Shipment exists but one or more values changed
            const updatedShipment =
                await prisma.shipment.update({
                    where: {
                        id: existingShipment.id,
                    },
                    data: shipment,
                });

            existingShipmentMap.set(
                key,
                updatedShipment
            );

            updated++;
        }

        res.json({
            message: "Excel imported successfully",
            added,
            updated,
            skipped,
            total: shipments.length,
        });
    } catch (error) {
        console.error(
            "Error reading Excel:",
            error
        );

        res.status(500).json({
            message: "Failed to read Excel file",
        });
    }
});

module.exports = router;