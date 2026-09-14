function generateReportEmailHtml(report, startDate, endDate) {
    const formatRupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatReportDate = (value) => {
        if (!value) return "-";

        const date = new Date(`${value}T00:00:00Z`);

        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
        });
    };

    const reportPeriod =
        startDate && endDate
            ? `${formatReportDate(startDate)} – ${formatReportDate(endDate)}`
            : startDate
                ? `From ${formatReportDate(startDate)}`
                : endDate
                    ? `Until ${formatReportDate(endDate)}`
                    : "All Shipments";

    const formatNumber = (value) => {
        return new Intl.NumberFormat("id-ID").format(value);
    };

    const statusRows = [
        {
            name: "In Progress",
            data: report.statuses["In Progress"],
        },
        {
            name: "Pending Completion",
            data: report.statuses["Pending Completion"],
        },
        {
            name: "Completed",
            data: report.statuses.Completed,
        },
    ];

    const statusTableRows = statusRows
        .map(
            (status) => `
                <tr>
                    <td>${status.name}</td>
                    <td>${formatNumber(status.data.shipments)}</td>
                    <td>${formatNumber(status.data.containers)}</td>
                    <td>${formatNumber(status.data.units)}</td>
                </tr>
            `
        )
        .join("");

    const statusMobileCards = statusRows
        .map(
            (status) => `
                <div style="
                    background-color: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                ">
                    <div style="
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 12px;
                    ">
                        ${status.name}
                    </div>

                    <table width="100%" cellpadding="0" cellspacing="0" style="
                        border-collapse: collapse;
                        font-size: 14px;
                    ">
                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">
                                Shipments
                            </td>
                            <td style="
                                padding: 5px 0;
                                text-align: right;
                                font-weight: 600;
                            ">
                                ${formatNumber(status.data.shipments)}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">
                                Containers
                            </td>
                            <td style="
                                padding: 5px 0;
                                text-align: right;
                                font-weight: 600;
                            ">
                                ${formatNumber(status.data.containers)}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">
                                Units
                            </td>
                            <td style="
                                padding: 5px 0;
                                text-align: right;
                                font-weight: 600;
                            ">
                                ${formatNumber(status.data.units)}
                            </td>
                        </tr>
                    </table>
                </div>
            `
        )
        .join("");

    const agentTableRows = report.agents
        .map(
            (agent) => `
                <tr>
                    <td>${agent.agent}</td>
                    <td>${formatNumber(agent.shipments)}</td>
                    <td>${formatNumber(agent.containers)}</td>
                    <td>${formatNumber(agent.units)}</td>
                    <td>${formatRupiah(agent.bm)}</td>
                    <td>${formatRupiah(agent.ppn)}</td>
                    <td>${formatRupiah(agent.pph)}</td>
                    <td>${formatRupiah(agent.totalPibPayment)}</td>
                </tr>
            `
        )
        .join("");

    const agentMobileCards = report.agents
        .map(
            (agent) => `
                <div style="
                    background-color: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                ">
                    <div style="
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 12px;
                    ">
                        ${agent.agent}
                    </div>

                    <table width="100%" cellpadding="0" cellspacing="0" style="
                        border-collapse: collapse;
                        font-size: 14px;
                    ">
                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">
                                Shipments
                            </td>
                            <td style="
                                padding: 5px 0;
                                text-align: right;
                                font-weight: 600;
                            ">
                                ${formatNumber(agent.shipments)}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">
                                Containers
                            </td>
                            <td style="
                                padding: 5px 0;
                                text-align: right;
                                font-weight: 600;
                            ">
                                ${formatNumber(agent.containers)}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">
                                Units
                            </td>
                            <td style="
                                padding: 5px 0;
                                text-align: right;
                                font-weight: 600;
                            ">
                                ${formatNumber(agent.units)}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">
                                BM
                            </td>
                            <td style="
                                padding: 5px 0;
                                text-align: right;
                            ">
                                ${formatRupiah(agent.bm)}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">
                                PPN
                            </td>
                            <td style="
                                padding: 5px 0;
                                text-align: right;
                            ">
                                ${formatRupiah(agent.ppn)}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">
                                PPh
                            </td>
                            <td style="
                                padding: 5px 0;
                                text-align: right;
                            ">
                                ${formatRupiah(agent.pph)}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 10px 0 5px;
                                color: #1f2937;
                                font-weight: bold;
                                border-top: 1px solid #e5e7eb;
                            ">
                                Total PIB
                            </td>
                            <td style="
                                padding: 10px 0 5px;
                                text-align: right;
                                font-weight: bold;
                                border-top: 1px solid #e5e7eb;
                            ">
                                ${formatRupiah(agent.totalPibPayment)}
                            </td>
                        </tr>
                    </table>
                </div>
            `
        )
        .join("");

    const agentEmptyState = `
        <div style="
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            color: #6b7280;
            font-size: 14px;
            text-align: center;
        ">
            No agent data for this period.
        </div>
    `;

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Inbound Shipment Report</title>

            <style>
                @media only screen and (max-width: 600px) {
                    body {
                        padding: 16px 8px !important;
                    }

                    .report-container {
                        width: 100% !important;
                        max-width: 100% !important;
                        border-radius: 8px !important;
                    }

                    .report-header {
                        padding: 22px 20px !important;
                    }

                    .report-header h1 {
                        font-size: 21px !important;
                    }

                    .report-content {
                        padding: 20px 16px !important;
                    }

                    .overview-table,
                    .overview-table tbody,
                    .overview-table tr {
                        display: block !important;
                        width: 100% !important;
                    }

                    .overview-cell {
                        display: block !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        padding: 6px 0 !important;
                    }

                    .overview-card {
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }

                    .desktop-status-table {
                        display: none !important;
                    }

                    .mobile-status-cards {
                        display: block !important;
                    }

                    .desktop-agent-table {
                        display: none !important;
                    }

                    .mobile-agent-cards {
                        display: block !important;
                    }

                    .report-footer {
                        padding: 18px 20px !important;
                    }
                }

                @media only screen and (min-width: 601px) {
                    .mobile-status-cards {
                        display: none !important;
                    }

                    .mobile-agent-cards {
                        display: none !important;
                    }
                }
            </style>
        </head>

        <body style="
            margin: 0;
            padding: 40px 20px;
            background-color: #f4f6f8;
            font-family: Arial, Helvetica, sans-serif;
            color: #1f2937;
        ">

            <div
                class="report-container"
                style="
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                "
            >

                <div
                    class="report-header"
                    style="
                        background-color: #111827;
                        color: #ffffff;
                        padding: 28px 32px;
                    "
                >
                    <h1
                        style="
                            margin: 0;
                            font-size: 24px;
                        "
                    >
                        Inbound Shipment Report
                    </h1>

                    <p
                        style="
                            margin: 8px 0 0;
                            color: #d1d5db;
                            font-size: 14px;
                        "
                    >
                        ${reportPeriod}
                    </p>
                </div>

                <div
                    class="report-content"
                    style="padding: 32px;"
                >

                    <h2 style="margin-top: 0; font-size: 18px;">
                        Shipment Overview
                    </h2>

                    <table
                        class="overview-table"
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                    >
                        <tr>
                            <td
                                class="overview-cell"
                                style="width: 33%; padding: 8px;"
                            >
                                <div
                                    class="overview-card"
                                    style="
                                        background-color: #f9fafb;
                                        border: 1px solid #e5e7eb;
                                        border-radius: 8px;
                                        padding: 18px;
                                    "
                                >
                                    <div style="color: #6b7280; font-size: 13px;">
                                        Total Shipments
                                    </div>

                                    <div style="
                                        font-size: 24px;
                                        font-weight: bold;
                                        margin-top: 6px;
                                    ">
                                        ${formatNumber(report.shipments)}
                                    </div>
                                </div>
                            </td>

                            <td
                                class="overview-cell"
                                style="width: 33%; padding: 8px;"
                            >
                                <div
                                    class="overview-card"
                                    style="
                                        background-color: #f9fafb;
                                        border: 1px solid #e5e7eb;
                                        border-radius: 8px;
                                        padding: 18px;
                                    "
                                >
                                    <div style="color: #6b7280; font-size: 13px;">
                                        Total Containers
                                    </div>

                                    <div style="
                                        font-size: 24px;
                                        font-weight: bold;
                                        margin-top: 6px;
                                    ">
                                        ${formatNumber(report.containers)}
                                    </div>
                                </div>
                            </td>

                            <td
                                class="overview-cell"
                                style="width: 33%; padding: 8px;"
                            >
                                <div
                                    class="overview-card"
                                    style="
                                        background-color: #f9fafb;
                                        border: 1px solid #e5e7eb;
                                        border-radius: 8px;
                                        padding: 18px;
                                    "
                                >
                                    <div style="color: #6b7280; font-size: 13px;">
                                        Total Units
                                    </div>

                                    <div style="
                                        font-size: 24px;
                                        font-weight: bold;
                                        margin-top: 6px;
                                    ">
                                        ${formatNumber(report.units)}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>

                    <h2 style="margin-top: 32px; font-size: 18px;">
                        Shipment Status
                    </h2>

                    <!-- Desktop version -->
                    <table
                        class="desktop-status-table"
                        width="100%"
                        cellpadding="10"
                        cellspacing="0"
                        style="
                            border-collapse: collapse;
                            font-size: 14px;
                            width: 100%;
                        "
                    >
                        <thead>
                            <tr style="
                                background-color: #f3f4f6;
                                text-align: left;
                            ">
                                <th>Status</th>
                                <th>Shipments</th>
                                <th>Containers</th>
                                <th>Units</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${statusTableRows}

                            <tr style="
                                font-weight: bold;
                                border-top: 2px solid #d1d5db;
                            ">
                                <td>Total</td>
                                <td>${formatNumber(report.shipments)}</td>
                                <td>${formatNumber(report.containers)}</td>
                                <td>${formatNumber(report.units)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Mobile version -->
                    <div
                        class="mobile-status-cards"
                        style="display: none;"
                    >
                        ${statusMobileCards}

                        <div style="
                            background-color: #f9fafb;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                            padding: 16px;
                            margin-bottom: 12px;
                        ">
                            <div style="
                                font-size: 16px;
                                font-weight: bold;
                                margin-bottom: 12px;
                            ">
                                Total
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" style="
                                border-collapse: collapse;
                                font-size: 14px;
                            ">
                                <tr>
                                    <td style="padding: 5px 0; color: #6b7280;">
                                        Shipments
                                    </td>
                                    <td style="
                                        padding: 5px 0;
                                        text-align: right;
                                        font-weight: 600;
                                    ">
                                        ${formatNumber(report.shipments)}
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 5px 0; color: #6b7280;">
                                        Containers
                                    </td>
                                    <td style="
                                        padding: 5px 0;
                                        text-align: right;
                                        font-weight: 600;
                                    ">
                                        ${formatNumber(report.containers)}
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 5px 0; color: #6b7280;">
                                        Units
                                    </td>
                                    <td style="
                                        padding: 5px 0;
                                        text-align: right;
                                        font-weight: 600;
                                    ">
                                        ${formatNumber(report.units)}
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <h2 style="margin-top: 32px; font-size: 18px;">
                        Arrival &amp; Clearance
                    </h2>

                    <table width="100%" cellpadding="10" cellspacing="0" style="
                        border-collapse: collapse;
                        font-size: 14px;
                        width: 100%;
                    ">
                        <tbody>
                            <tr>
                                <td>Arrival at Yard</td>
                                <td>
                                    ${formatNumber(report.milestones.arrivalAtYard)}
                                    / ${formatNumber(report.shipments)}
                                </td>
                            </tr>

                            <tr>
                                <td>Not Yet Arrived</td>
                                <td>
                                    ${formatNumber(report.milestones.notYetAtYard)}
                                </td>
                            </tr>

                            <tr>
                                <td>PIB Clearance</td>
                                <td>
                                    ${formatNumber(report.milestones.pibClearance)}
                                    / ${formatNumber(report.shipments)}
                                </td>
                            </tr>

                            <tr>
                                <td>Not Yet PIB Cleared</td>
                                <td>
                                    ${formatNumber(report.milestones.notYetPibCleared)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <h2 style="margin-top: 32px; font-size: 18px;">
                        PIB Payment
                    </h2>

                    <table width="100%" cellpadding="10" cellspacing="0" style="
                        border-collapse: collapse;
                        font-size: 14px;
                        width: 100%;
                    ">
                        <tbody>
                            <tr>
                                <td>BM</td>
                                <td>${formatRupiah(report.payments.bm)}</td>
                            </tr>

                            <tr>
                                <td>PPN</td>
                                <td>${formatRupiah(report.payments.ppn)}</td>
                            </tr>

                            <tr>
                                <td>PPh</td>
                                <td>${formatRupiah(report.payments.pph)}</td>
                            </tr>

                            <tr style="
                                font-weight: bold;
                                border-top: 2px solid #d1d5db;
                            ">
                                <td>Total PIB Payment</td>
                                <td>
                                    ${formatRupiah(report.payments.totalPibPayment)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <h2 style="margin-top: 32px; font-size: 18px;">
                        Summary by Agent
                    </h2>

                    <!-- Desktop version -->
                    <table
                        class="desktop-agent-table"
                        width="100%"
                        cellpadding="8"
                        cellspacing="0"
                        style="
                            border-collapse: collapse;
                            font-size: 12px;
                            width: 100%;
                        "
                    >
                        <thead>
                            <tr style="
                                background-color: #f3f4f6;
                                text-align: left;
                            ">
                                <th>Agent</th>
                                <th>Shipments</th>
                                <th>Containers</th>
                                <th>Units</th>
                                <th>BM</th>
                                <th>PPN</th>
                                <th>PPh</th>
                                <th>Total PIB</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${
                                report.agents.length > 0
                                    ? agentTableRows
                                    : `
                                        <tr>
                                            <td
                                                colspan="8"
                                                style="
                                                    padding: 20px;
                                                    text-align: center;
                                                    color: #6b7280;
                                                "
                                            >
                                                No agent data for this period.
                                            </td>
                                        </tr>
                                    `
                            }
                        </tbody>
                    </table>

                    <!-- Mobile version -->
                    <div
                        class="mobile-agent-cards"
                        style="display: none;"
                    >
                        ${
                            report.agents.length > 0
                                ? agentMobileCards
                                : agentEmptyState
                        }
                    </div>

                </div>

                <div
                    class="report-footer"
                    style="
                        padding: 20px 32px;
                        background-color: #f9fafb;
                        border-top: 1px solid #e5e7eb;
                        color: #6b7280;
                        font-size: 12px;
                    "
                >
                    This report was generated automatically by the Inbound
                    Shipment Management System.
                </div>

            </div>

        </body>
        </html>
    `;

    return emailHtml;
}

module.exports = {
    generateReportEmailHtml,
};