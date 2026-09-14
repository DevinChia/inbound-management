import { useEffect, useState } from "react";
import { useToast } from "../components/ToastContext";

function Reports() {
  const { showToast } = useToast();

  const [agents, setAgents] = useState([]);
  const [payments, setPayments] = useState(null);
  const [summary, setSummary] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [error, setError] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [recipientError, setRecipientError] = useState("");
  const [reportPreview, setReportPreview] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    const fetchAgentReport = async () => {
      try {
        if (startDate && endDate && startDate > endDate) {
          setDateError("Start Date cannot be later than End Date.");
          setSummary(null);
          setAgents([]);
          setPayments(null);
          return;
        }

        setDateError("");

        const params = new URLSearchParams();

        if (startDate) {
          params.append("startDate", startDate);
        }

        if (endDate) {
          params.append("endDate", endDate);
        }

        const summaryResponse = await fetch(
          `http://localhost:5000/api/reports/summary?${params.toString()}`
        );

        if (!summaryResponse.ok) {
          throw new Error("Failed to fetch report summary");
        }

        const summaryData = await summaryResponse.json();

        setSummary(summaryData);

        const response = await fetch(
          `http://localhost:5000/api/reports/agents?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch agent report");
        }

        const data = await response.json();

        setAgents(data);

        const paymentResponse = await fetch(
          `http://localhost:5000/api/reports/payments?${params.toString()}`
        );

        if (!paymentResponse.ok) {
          throw new Error("Failed to fetch payment report");
        }

        const paymentData = await paymentResponse.json();

        setPayments(paymentData);
      } catch (error) {
        console.error(error);
        setError(error.message);
      }
    };

    fetchAgentReport();
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/report-recipients/active"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch report recipients");
        }

        const data = await response.json();

        setRecipients(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchRecipients();
  }, []);

  const handleRecipientToggle = (id) => {
    setSelectedRecipients((current) => {
      if (current.includes(id)) {
        return current.filter(
          (recipientId) => recipientId !== id
        );
      }

      setRecipientError("");

      return [...current, id];
    });
  };

  const handleOpenSendModal = async () => {
    setRecipientError("");
    setReportPreview("");
    setLoadingPreview(true);
    setIsSendModalOpen(true);
  
    try {
      const params = new URLSearchParams();
  
      if (startDate) {
        params.append("startDate", startDate);
      }
  
      if (endDate) {
        params.append("endDate", endDate);
      }
  
      const response = await fetch(
        `http://localhost:5000/api/reports/preview?${params.toString()}`
      );
  
      if (!response.ok) {
        throw new Error("Failed to fetch report preview");
      }
  
      const html = await response.text();
  
      setReportPreview(html);
    } catch (error) {
      console.error("Error fetching report preview:", error);
      setReportPreview("");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSendReport = async () => {
    setSendingReport(true);

    try {
      const params = new URLSearchParams();

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      const response = await fetch(
        `http://localhost:5000/api/reports/send?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipientIds: selectedRecipients,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send report");
      }

      const data = await response.json();

      showToast(data.message);

      setIsSendModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast("Could not send report.", "error");
    } finally {
      setSendingReport(false);
    }
  };

  const agentTotals = agents.reduce(
    (totals, agent) => ({
      shipments: totals.shipments + agent.shipments,
      containers: totals.containers + agent.containers,
      units: totals.units + agent.units,
      bm: totals.bm + agent.bm,
      ppn: totals.ppn + agent.ppn,
      pph: totals.pph + agent.pph,
      totalPibPayment:
        totals.totalPibPayment + agent.totalPibPayment,
    }),
    {
      shipments: 0,
      containers: 0,
      units: 0,
      bm: 0,
      ppn: 0,
      pph: 0,
      totalPibPayment: 0,
    }
  );

  if (error) {
    return (
      <p className="p-4 text-red-600 sm:p-6">
        {error}
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-gray-900">
        Reports
      </h1>

      <p className="mt-1 text-gray-600">
        Shipment reports and summaries.
      </p>

      <div className="mt-6 rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Report Period
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>

            <input
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>

            <input
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
            />

            {dateError && (
              <p className="mt-2 text-sm text-red-600">
                {dateError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleOpenSendModal}
          disabled={!!dateError}
          className="w-full rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Send Report
        </button>
      </div>

      {summary && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-gray-500">
              Shipments
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summary.shipments.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-gray-500">
              Containers
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summary.containers.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-gray-500">
              Units
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summary.units.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {payments && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-gray-500">
              BM
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              Rp {payments.bm.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-gray-500">
              PPN
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              Rp {payments.ppn.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-gray-500">
              PPh
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              Rp {payments.pph.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-gray-500">
              Total PIB Payment
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              Rp {payments.totalPibPayment.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Summary by Agent
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                  Agent
                </th>

                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                  Shipments
                </th>

                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                  Containers
                </th>

                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                  Units
                </th>

                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                  BM
                </th>

                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                  PPN
                </th>

                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                  PPh
                </th>

                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                  Total PIB Payment
                </th>
              </tr>
            </thead>

            <tbody>
              {agents.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No agent data for this period.
                  </td>
                </tr>
              ) : (
                <>
                  {agents.map((agent) => (
                    <tr
                      key={agent.agent}
                      className="border-b last:border-0"
                    >
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900 sm:px-4">
                        {agent.agent}
                      </td>

                      <td className="px-3 py-3 sm:px-4">
                        {agent.shipments.toLocaleString()}
                      </td>

                      <td className="px-3 py-3 sm:px-4">
                        {agent.containers.toLocaleString()}
                      </td>

                      <td className="px-3 py-3 sm:px-4">
                        {agent.units.toLocaleString()}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                        Rp {agent.bm.toLocaleString("id-ID")}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                        Rp {agent.ppn.toLocaleString("id-ID")}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                        Rp {agent.pph.toLocaleString("id-ID")}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                        Rp{" "}
                        {agent.totalPibPayment.toLocaleString(
                          "id-ID"
                        )}
                      </td>
                    </tr>
                  ))}

                  <tr className="border-t-2 font-bold text-gray-900">
                    <td className="px-3 py-3 sm:px-4">
                      Total
                    </td>

                    <td className="px-3 py-3 sm:px-4">
                      {agentTotals.shipments.toLocaleString()}
                    </td>

                    <td className="px-3 py-3 sm:px-4">
                      {agentTotals.containers.toLocaleString()}
                    </td>

                    <td className="px-3 py-3 sm:px-4">
                      {agentTotals.units.toLocaleString()}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      Rp {agentTotals.bm.toLocaleString("id-ID")}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      Rp {agentTotals.ppn.toLocaleString("id-ID")}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      Rp {agentTotals.pph.toLocaleString("id-ID")}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      Rp{" "}
                      {agentTotals.totalPibPayment.toLocaleString(
                        "id-ID"
                      )}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isSendModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20 sm:items-center sm:pt-4"
          onClick={() => {
            if (!sendingReport) {
              setIsSendModalOpen(false);
            }
          }}
        >
          <div
            className="max-h-[calc(100vh-5rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:max-h-[90vh] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Send Report
              </h2>

              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                disabled={sendingReport}
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Select the report period and recipients.
            </p>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">
                Report Preview
              </h3>

              <div className="mt-2">
                {loadingPreview ? (
                  <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-500">
                      Loading preview...
                    </p>
                  </div>
                ) : reportPreview ? (
                  <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200">
                    <iframe
                      title="Report Preview"
                      srcDoc={reportPreview}
                      sandbox=""
                      className="h-75 w-full min-w-0 border-0 bg-white md:w-225 md:min-w-225"
                    />
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-lg border border-red-200 bg-red-50">
                    <p className="text-sm text-red-600">
                      Failed to load report preview.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">
                Report Period
              </h3>

              <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
                {startDate || endDate ? (
                  <>
                    {startDate && (
                      <p>
                        <span className="font-medium">
                          Start Date:
                        </span>{" "}
                        {startDate}
                      </p>
                    )}

                    {endDate && (
                      <p className={startDate ? "mt-1" : ""}>
                        <span className="font-medium">
                          End Date:
                        </span>{" "}
                        {endDate}
                      </p>
                    )}
                  </>
                ) : (
                  <p>All available dates</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">
                Recipients
              </label>

              <div className="mt-2 space-y-2">
                {recipients.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No active recipients available.
                  </p>
                ) : (
                  recipients.map((recipient) => (
                    <label
                      key={recipient.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(
                          recipient.id
                        )}
                        onChange={() =>
                          handleRecipientToggle(recipient.id)
                        }
                        disabled={sendingReport}
                        className="h-4 w-4 rounded border-gray-300"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {recipient.name}
                        </p>

                        <p className="break-all text-xs text-gray-500">
                          {recipient.email}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {recipientError && (
                <p className="mt-2 text-sm text-red-600">
                  {recipientError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                disabled={sendingReport}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedRecipients.length === 0) {
                    setRecipientError(
                      "Please select at least one recipient."
                    );
                    return;
                  }

                  setRecipientError("");
                  handleSendReport();
                }}
                disabled={sendingReport}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingReport ? "Sending..." : "Send Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;