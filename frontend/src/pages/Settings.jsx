import { useEffect, useState } from "react";
import { useToast } from "../components/ToastContext";

function Settings() {
  const { showToast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [recipientIsActive, setRecipientIsActive] = useState(true);
  const [savingRecipient, setSavingRecipient] = useState(false);

  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/report-recipients"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch recipients.");
        }

        const data = await response.json();

        setRecipients(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchRecipients();
  }, []);

  const handleAddRecipient = async () => {
    setSavingRecipient(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/report-recipients",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: recipientName,
            email: recipientEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add recipient.");
      }

      setRecipients((current) => [
        ...current,
        data.recipient,
      ]);

      showToast("Recipient added successfully.");

      setRecipientName("");
      setRecipientEmail("");
      setRecipientIsActive(true);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast(error.message, "error");
    } finally {
      setSavingRecipient(false);
    }
  };

  const handleEditRecipient = (recipient) => {
    setEditingRecipient(recipient);
    setRecipientName(recipient.name);
    setRecipientEmail(recipient.email);
    setRecipientIsActive(recipient.isActive);
    setIsAddModalOpen(true);
  };

  const handleSaveRecipient = async () => {
    setSavingRecipient(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/report-recipients/${editingRecipient.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: recipientName,
            email: recipientEmail,
            isActive: recipientIsActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update recipient."
        );
      }

      setRecipients((current) =>
        current.map((recipient) =>
          recipient.id === data.recipient.id
            ? data.recipient
            : recipient
        )
      );

      showToast("Recipient updated successfully.");

      setRecipientName("");
      setRecipientEmail("");
      setEditingRecipient(null);
      setRecipientIsActive(true);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast(error.message, "error");
    } finally {
      setSavingRecipient(false);
    }
  };

  const handleCloseRecipientModal = () => {
    setIsAddModalOpen(false);
    setEditingRecipient(null);
    setRecipientName("");
    setRecipientEmail("");
    setRecipientIsActive(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-gray-900">
        Settings
      </h1>

      <p className="mt-1 text-gray-600">
        Manage application settings.
      </p>

      <div className="mt-6 rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Report Recipients
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage the people who can receive shipment reports.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingRecipient(null);
              setRecipientName("");
              setRecipientEmail("");
              setRecipientIsActive(true);
              setIsAddModalOpen(true);
            }}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 sm:w-auto"
          >
            + Add Recipient
          </button>
        </div>

        <div className="mt-6">
          {recipients.length === 0 ? (
            <p className="text-sm text-gray-500">
              No recipients added yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-150 text-left text-sm sm:min-w-full">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="px-4 py-3 font-medium">
                      Name
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Email
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recipients.map((recipient) => (
                    <tr
                      key={recipient.id}
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-3 wrap-break-word font-medium text-gray-900">
                        {recipient.name}
                      </td>

                      <td className="px-4 py-3 text-gray-700 break-all">
                        {recipient.email}
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {recipient.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleEditRecipient(recipient)
                          }
                          className="text-sm font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20 sm:items-center sm:pt-4"
          onClick={() => {
            if (!savingRecipient) {
              handleCloseRecipientModal();
            }
          }}
        >
          <div
            className="max-h-[calc(100vh-5rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:max-h-[90vh] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRecipient
                  ? "Edit Recipient"
                  : "Add Recipient"}
              </h2>

              <button
                type="button"
                onClick={handleCloseRecipientModal}
                disabled={savingRecipient}
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();

                if (editingRecipient) {
                  handleSaveRecipient();
                } else {
                  handleAddRecipient();
                }
              }}
            >
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={recipientName}
                    onChange={(event) =>
                      setRecipientName(event.target.value)
                    }
                    placeholder="e.g. John Doe"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(event) =>
                      setRecipientEmail(event.target.value)
                    }
                    placeholder="e.g. john@example.com"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500"
                  />
                </div>

                {editingRecipient && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>

                    <label className="mt-2 flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={recipientIsActive}
                        onChange={(event) =>
                          setRecipientIsActive(
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />

                      <span className="text-sm text-gray-700">
                        Active
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseRecipientModal}
                  disabled={savingRecipient}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingRecipient}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingRecipient
                    ? editingRecipient
                      ? "Saving..."
                      : "Adding..."
                    : editingRecipient
                      ? "Save Changes"
                      : "Add Recipient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;