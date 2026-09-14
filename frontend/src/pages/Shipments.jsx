import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getShipmentStatus } from "../utils/shipmentStatus";
import { useToast } from "../components/ToastContext";

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

function Shipments() {
  const { showToast } = useToast();
  
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  const [pageInput, setPageInput] = useState(String(currentPage));

  const shipmentsPerPage = 20;

  const handleExport = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/shipments/export"
      );

      if (!response.ok) {
        throw new Error("Failed to export shipments");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "Inbound Shipments.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      showToast("Shipments exported successfully.");
    } catch (error) {
      console.error(error);
      showToast("Could not export shipments.", "error");
    }
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/shipments")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch shipments");
        }

        return response.json();
      })
      .then((data) => {
        setShipments(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Could not load shipments");
        setLoading(false);
      });
  }, []);

  const agents = [
    ...new Set(
      shipments
        .map((shipment) => shipment.agent)
        .filter(Boolean)
    ),
  ].sort();

  const filteredShipments = shipments.filter((shipment) => {
    const searchTerm = search.toLowerCase();

    const matchesSearch =
      shipment.blNumber?.toLowerCase().includes(searchTerm) ||
      shipment.invoiceNumber?.toLowerCase().includes(searchTerm) ||
      shipment.vesselName?.toLowerCase().includes(searchTerm) ||
      shipment.agent?.toLowerCase().includes(searchTerm);

    const matchesAgent =
      selectedAgent === "" ||
      (selectedAgent === "__NO_AGENT__"
        ? shipment.agent === null
        : shipment.agent === selectedAgent);

    const matchesStatus =
      selectedStatus === "" ||
      getShipmentStatus(shipment) === selectedStatus;

    return matchesSearch && matchesAgent && matchesStatus;
  });

  const sortedShipments = [...filteredShipments].sort((a, b) => {
    if (!sortBy) {
      return 0;
    }
  
    let comparison = 0;
  
    if (
      sortBy === "arrivalEstimation" ||
      sortBy === "arrivalAtYard" ||
      sortBy === "pibClearanceDate"
    ) {
      const dateA = a[sortBy]
        ? new Date(a[sortBy]).getTime()
        : sortDirection === "asc"
          ? Infinity
          : -Infinity;
  
      const dateB = b[sortBy]
        ? new Date(b[sortBy]).getTime()
        : sortDirection === "asc"
          ? Infinity
          : -Infinity;
  
      comparison = dateA - dateB;
    }
  
    if (
      sortBy === "totalPibPayment" ||
      sortBy === "containers" ||
      sortBy === "units"
    ) {
      comparison =
        Number(a[sortBy] ?? 0) - Number(b[sortBy] ?? 0);
    }
  
    return sortDirection === "asc"
      ? comparison
      : -comparison;
  });

  const totalPages = Math.ceil(
    sortedShipments.length / shipmentsPerPage
  );
  
  const startIndex = (currentPage - 1) * shipmentsPerPage;
  
  const paginatedShipments = sortedShipments.slice(
    startIndex,
    startIndex + shipmentsPerPage
  );

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
  
    setPageInput(String(nextPage));
    setSearchParams({ page: String(nextPage) });
  };

  const handlePageInputChange = (event) => {
    const value = event.target.value;
  
    if (value === "") {
      setPageInput("");
      return;
    }
  
    const page = Number(value);
  
    if (page > totalPages) {
      setPageInput(String(totalPages));
      return;
    }
  
    setPageInput(value);
  };

  const handlePageInputSubmit = () => {
    const value = Number(pageInput);

    if (!value || value < 1) {
      setPageInput(String(currentPage));
      return;
    }

    const nextPage = Math.min(value, totalPages);

    goToPage(nextPage);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setSearchParams({ page: "1" });
  };

  const handleAgentChange = (event) => {
    setSelectedAgent(event.target.value);
    setSearchParams({ page: "1" });
  };

  if (loading) {
    return <p className="p-4 sm:p-6">Loading shipments...</p>;
  }

  if (error) {
    return <p className="p-4 sm:p-6 text-red-600">{error}</p>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Shipments</h1>

            <p className="mt-1 text-gray-600">
              Showing {filteredShipments.length} of {shipments.length} shipments
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleExport}
              className="rounded-lg border border-gray-300 w-full px-4 py-2 sm:w-auto hover:bg-gray-100"
            >
              Export Excel
            </button>

            <button
              onClick={() => navigate("/shipments/new")}
              className="rounded-lg bg-black w-full px-4 py-2 sm:w-auto text-white hover:bg-gray-800"
            >
              + Add New Shipment
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search BL number, invoice, vessel, or agent..."
          value={search}
          onChange={handleSearchChange}
          className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-gray-500"
        />

        <p className="mt-4 text-sm font-medium text-gray-700">
          Filter
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <select
            value={selectedAgent}
            onChange={handleAgentChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
          >
            <option value="">All Agents</option>
            <option value="__NO_AGENT__">No Agent</option>

            {agents.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(event) => {
              setSelectedStatus(event.target.value);
              setSearchParams({ page: "1" });
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
          >
            <option value="">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Completion">Pending Completion</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <p className="mt-4 text-sm font-medium text-gray-700">
          Sort
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              setSearchParams({ page: "1" });
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
          >
            <option value="">Default Order</option>
            <option value="arrivalEstimation">Arrival Estimation</option>
            <option value="arrivalAtYard">Arrival at Yard</option>
            <option value="pibClearanceDate">PIB Clearance</option>
            <option value="totalPibPayment">Total PIB Payment</option>
            <option value="containers">Containers</option>
            <option value="units">Units</option>
          </select>

          <select
            value={sortDirection}
            onChange={(event) => {
              setSortDirection(event.target.value);
              setSearchParams({ page: "1" });
            }}
            disabled={!sortBy}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {filteredShipments.length === 0 ? (
        <p>No shipments found.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="whitespace-nowrap px-3 py-3 sm:px-4 text-left font-semibold">
                    No.
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 sm:px-4 text-left font-semibold">
                    Agent
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 sm:px-4 text-left font-semibold">
                    BL Number
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 sm:px-4 text-left font-semibold">
                    Invoice Number
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 sm:px-4 text-left font-semibold">
                    Vessel
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 sm:px-4 text-right font-semibold">
                    Containers
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 sm:px-4 text-right font-semibold">
                    Units
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 sm:px-4 text-left font-semibold">
                    Arrival Estimation
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 sm:px-4 text-left font-semibold">
                    Arrival at Yard
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 sm:px-4 text-left font-semibold">
                    PIB Clearance
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 sm:px-4 text-right font-semibold">
                    Total PIB Payment
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 sm:px-4 text-left font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {paginatedShipments.map((shipment, index) => (
                  <tr
                    key={shipment.id}
                    onClick={() => navigate(`/shipments/${shipment.id}`)}
                    className="cursor-pointer hover:bg-gray-100/55"
                  >
                    <td className="px-3 py-3 sm:px-4">
                      {startIndex + index + 1}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      {shipment.agent || "-"}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4 font-medium">
                      {shipment.blNumber || "-"}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      {shipment.invoiceNumber || "-"}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      {shipment.vesselName || "-"}
                    </td>

                    <td className="px-3 py-3 sm:px-4 text-right">
                      {shipment.containers ?? "-"}
                    </td>

                    <td className="px-3 py-3 sm:px-4 text-right">
                      {shipment.units ?? "-"}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      {formatDate(shipment.arrivalEstimation)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      {formatDate(shipment.arrivalAtYard)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      {formatDate(shipment.pibClearanceDate)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4 text-right">
                      {formatRupiah(shipment.totalPibPayment)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2"
            >
              <span className="sm:hidden">{"<<"}</span>
              <span className="hidden sm:inline">First</span>
            </button>

            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2"
            >
              <span className="sm:hidden">{"<"}</span>
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Page</span>

              <input
                type="number"
                min="1"
                max={totalPages}
                value={pageInput}
                onChange={handlePageInputChange}
                onBlur={handlePageInputSubmit}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                className="w-14 rounded-md border border-gray-300 px-2 py-1 text-center text-sm outline-none focus:border-gray-500"
              />

              <span>of {totalPages}</span>
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2"
            >
              <span className="sm:hidden">{">"}</span>
              <span className="hidden sm:inline">Next</span>
            </button>

            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2"
            >
              <span className="sm:hidden">{">>"}</span>
              <span className="hidden sm:inline">Last</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Shipments;