async function generateReport(prisma, startDate, endDate) {
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
            agent: true,
            blNumber: true,
            invoiceNumber: true,
            vesselName: true,
            containers: true,
            units: true,
            arrivalEstimation: true,
            arrivalAtYard: true,
            pibClearanceDate: true,
            bm: true,
            ppn: true,
            pph: true,
            totalPibPayment: true,
        },
    });

    const getStatus = (shipment) => {
        const isCompleted =
            shipment.agent !== null &&
            shipment.blNumber !== null &&
            shipment.invoiceNumber !== null &&
            shipment.vesselName !== null &&
            shipment.containers !== null &&
            shipment.units !== null &&
            shipment.arrivalEstimation !== null &&
            shipment.arrivalAtYard !== null &&
            shipment.pibClearanceDate !== null &&
            shipment.bm !== null &&
            shipment.ppn !== null &&
            Number(shipment.totalPibPayment) > 0;

        if (isCompleted) {
            return "Completed";
        }

        if (shipment.arrivalAtYard !== null) {
            return "Pending Completion";
        }

        return "In Progress";
    };

    const report = {
        shipments: shipments.length,

        containers: 0,

        units: 0,

        statuses: {
            "In Progress": {
                shipments: 0,
                containers: 0,
                units: 0,
            },

            "Pending Completion": {
                shipments: 0,
                containers: 0,
                units: 0,
            },

            Completed: {
                shipments: 0,
                containers: 0,
                units: 0,
            },
        },

        milestones: {
            arrivalAtYard: 0,
            notYetAtYard: 0,
            pibClearance: 0,
            notYetPibCleared: 0,
        },

        payments: {
            bm: 0,
            ppn: 0,
            pph: 0,
            totalPibPayment: 0,
        },

        agents: {},
    };

    for (const shipment of shipments) {
        const status = getStatus(shipment);

        const containers = shipment.containers || 0;
        const units = shipment.units || 0;

        report.containers += containers;
        report.units += units;

        report.statuses[status].shipments += 1;
        report.statuses[status].containers += containers;
        report.statuses[status].units += units;

        if (shipment.arrivalAtYard !== null) {
            report.milestones.arrivalAtYard += 1;
        } else {
            report.milestones.notYetAtYard += 1;
        }

        if (shipment.pibClearanceDate !== null) {
            report.milestones.pibClearance += 1;
        } else {
            report.milestones.notYetPibCleared += 1;
        }

        report.payments.bm += Number(shipment.bm || 0);
        report.payments.ppn += Number(shipment.ppn || 0);
        report.payments.pph += Number(shipment.pph || 0);
        report.payments.totalPibPayment += Number(
            shipment.totalPibPayment || 0
        );

        const agent = shipment.agent || "-";

        if (!report.agents[agent]) {
            report.agents[agent] = {
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

        report.agents[agent].shipments += 1;
        report.agents[agent].containers += containers;
        report.agents[agent].units += units;
        report.agents[agent].bm += Number(shipment.bm || 0);
        report.agents[agent].ppn += Number(shipment.ppn || 0);
        report.agents[agent].pph += Number(shipment.pph || 0);
        report.agents[agent].totalPibPayment += Number(
            shipment.totalPibPayment || 0
        );
    }

    report.agents = Object.values(report.agents);

    return report;
}

module.exports = {
    generateReport,
};