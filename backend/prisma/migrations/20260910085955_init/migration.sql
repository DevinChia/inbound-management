-- CreateTable
CREATE TABLE "Shipment" (
    "id" SERIAL NOT NULL,
    "agent" TEXT,
    "blNumber" TEXT,
    "invoiceNumber" TEXT,
    "vesselName" TEXT,
    "containers" INTEGER,
    "units" INTEGER,
    "arrivalEstimation" TIMESTAMP(3),
    "arrivalAtYard" TIMESTAMP(3),
    "pibClearanceDate" TIMESTAMP(3),
    "bm" DECIMAL(65,30),
    "ppn" DECIMAL(65,30),
    "pph" DECIMAL(65,30),
    "totalPibPayment" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);
