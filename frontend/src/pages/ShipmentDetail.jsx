import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../components/ToastContext";
import { getShipmentStatus } from "../utils/shipmentStatus";

function formatDate(date) {
  if (!date) {
    return "-";
  }

  const [year, month, day] = date.split("T")[0].split("-");

  return `${day}/${month}/${year}`;
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this shipment?"
    );
  
    if (!confirmed) {
      return;
    }
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/shipments/${id}`,
        {
          method: "DELETE",
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete shipment");
      }
  
      showToast("Shipment deleted successfully!");
  
      navigate("/shipments");
    } catch (error) {
      console.error(error);
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/shipments/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch shipment");
        }

        return response.json();
      })
      .then((data) => {
        setShipment(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Could not load shipment");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <p className="p-4 sm:p-6">Loading shipment...</p>;
  }

  if (error) {
    return <p className="p-4 sm:p-6 text-red-600">{error}</p>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate("/shipments")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 sm:w-auto sm:text-base"
        >
          ← Back to Shipments
        </button>

        <div className="flex w-full gap-2 sm:w-auto">
          <button
            onClick={() => navigate(`/shipments/${shipment.id}/edit`)}
            className="flex-1 rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 sm:flex-none sm:text-base"
          >
            Edit Shipment
          </button>

          <button
            onClick={handleDelete}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 sm:flex-none sm:text-base"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Shipment Detail</h1>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            getShipmentStatus(shipment) === "Completed"
              ? "bg-green-100 text-green-700"
              : getShipmentStatus(shipment) === "Pending Completion"
              ? "bg-orange-100 text-orange-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {getShipmentStatus(shipment)}
        </span>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold">
            Shipment Information
          </h2>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm text-gray-500">Agent</p>
              <p className="font-medium">{shipment.agent || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">BL Number</p>
              <p className="wrap-break-word font-medium">{shipment.blNumber || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Invoice Number</p>
              <p className="wrap-break-word">{shipment.invoiceNumber || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Vessel</p>
              <p className="wrap-break-word">{shipment.vesselName || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Containers</p>
              <p>{shipment.containers ?? "-"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Units</p>
              <p>{shipment.units ?? "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold">
            Arrival Information
          </h2>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm text-gray-500">
                Arrival Estimation
              </p>
              <p>{formatDate(shipment.arrivalEstimation)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Arrival at Yard
              </p>
              <p>{formatDate(shipment.arrivalAtYard)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                PIB Clearance
              </p>
              <p>{formatDate(shipment.pibClearanceDate)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 sm:p-6 md:col-span-2">
          <h2 className="text-lg font-semibold">
            PIB Payment
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">BM</p>
              <p className="font-medium">
                {formatRupiah(shipment.bm)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">PPN</p>
              <p className="font-medium">
                {formatRupiah(shipment.ppn)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">PPh</p>
              <p className="font-medium">
                {formatRupiah(shipment.pph)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total PIB Payment
              </p>
              <p className="font-medium">
                {formatRupiah(shipment.totalPibPayment)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShipmentDetail;