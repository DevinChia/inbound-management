import { useEffect, useState } from "react";
import API_URL from "../api";

function Dashboard() {
  const [data, setData] = useState(null);
  const [upcomingShipments, setUpcomingShipments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard`);

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const result = await response.json();
        setData(result);

        const upcomingResponse = await fetch(
          `${API_URL}/api/dashboard/upcoming`
        );
        
        if (!upcomingResponse.ok) {
          throw new Error("Failed to fetch upcoming shipments");
        }
        
        const upcomingData = await upcomingResponse.json();
        
        setUpcomingShipments(upcomingData);
      } catch (error) {
        console.error(error);
        setError(error.message);
      }
    };

    fetchDashboard();
  }, []);

  if (error) {
    return <p className="p-4 sm:p-6 text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="p-4 sm:p-6">Loading dashboard...</p>;
  }

  const cards = [
    {
      title: "Total Shipments",
      value: data.totalShipments,
    },
    {
      title: "Total Containers",
      value: data.totalContainers,
    },
    {
      title: "Total Units",
      value: data.totalUnits,
    },
    {
      title: "In Progress",
      value: data.shipmentsInProgress,
    },
    {
      title: "Pending Completion",
      value: data.shipmentsPendingCompletion,
    },
    {
      title: "Arrived at Yard",
      value: data.shipmentsArrived,
    },
    {
      title: "PIB Cleared",
      value: data.shipmentsCleared,
    },
    {
      title: "Completed",
      value: data.shipmentsCompleted,
    },
  ];

  const getPercentage = (value) => {
    if (data.totalShipments === 0) {
      return 0;
    }
  
    return (value / data.totalShipments) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <p className="mt-1 text-gray-600">
        Inbound Shipment Management System
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl bg-white p-4 shadow-sm sm:p-5"
          >
            <p className="text-sm font-medium text-gray-500">
              {card.title}
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Shipment Status
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">In Progress</span>
              <span className="font-medium">
                {data.shipmentsInProgress}
              </span>
            </div>

            <div className="mt-2 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-yellow-500"
                style={{
                  width: `${getPercentage(data.shipmentsInProgress)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending Completion</span>
              <span className="font-medium">
                {data.shipmentsPendingCompletion}
              </span>
            </div>

            <div className="mt-2 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-orange-500"
                style={{
                  width: `${getPercentage(data.shipmentsPendingCompletion)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Arrived at Yard</span>
              <span className="font-medium">
                {data.shipmentsArrived}
              </span>
            </div>

            <div className="mt-2 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{
                  width: `${getPercentage(data.shipmentsArrived)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">PIB Cleared</span>
              <span className="font-medium">
                {data.shipmentsCleared}
              </span>
            </div>

            <div className="mt-2 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{
                  width: `${getPercentage(data.shipmentsCleared)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium">
                {data.shipmentsCompleted}
              </span>
            </div>

            <div className="mt-2 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-green-600"
                style={{
                  width: `${getPercentage(data.shipmentsCompleted)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Pending Arrivals
        </h2>

        <div className="mt-4 divide-y">
          {upcomingShipments.map((shipment) => (
            <div
              key={shipment.id}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {shipment.vesselName}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {shipment.blNumber} · {shipment.invoiceNumber}
                </p>
              </div>

              <p
                className={`text-sm font-medium ${
                  new Date(shipment.arrivalEstimation).toISOString().slice(0, 10) <
                  new Date().toISOString().slice(0, 10)
                    ? "text-red-600"
                    : "text-gray-700"
                }`}
              >
                {new Date(shipment.arrivalEstimation).toLocaleDateString("en-GB")}
              </p>
            </div>
          ))}

          {upcomingShipments.length === 0 && (
            <p className="py-4 text-sm text-gray-500">
              No upcoming shipments found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;