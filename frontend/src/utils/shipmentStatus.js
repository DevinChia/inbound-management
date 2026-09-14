export function getShipmentStatus(shipment) {
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
}