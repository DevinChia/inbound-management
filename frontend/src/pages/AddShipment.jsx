import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastContext";

function isValidDate(value) {
  if (!value) {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (year < 2000 || year > 2100) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function AddShipment() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    agent: "",
    blNumber: "",
    invoiceNumber: "",
    vesselName: "",
    containers: "",
    units: "",
    arrivalEstimation: "",
    arrivalAtYard: "",
    pibClearanceDate: "",
    bm: "",
    ppn: "",
    pph: "",
    totalPibPayment: "",
  });

  const inputRefs = useRef([]);

  // Focus the first field when the page opens
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
  
    // Only allow numbers for numeric fields
    if (
      ["containers", "bm", "ppn", "pph"].includes(name) &&
      !/^\d*$/.test(value)
    ) {
      return;
    }
  
    setForm((previousForm) => {
      const updatedForm = {
        ...previousForm,
        [name]: value,
      };

      // Units = Containers × 2
      if (name === "containers") {
        updatedForm.units = value
          ? Number(value) * 2
          : "";
      }

      // Total PIB = BM + PPN + PPh
      // PPh is optional and treated as 0 when blank
      if (["bm", "ppn", "pph"].includes(name)) {
        const bmFilled = updatedForm.bm !== "";
        const ppnFilled = updatedForm.ppn !== "";

        updatedForm.totalPibPayment =
          bmFilled && ppnFilled
            ? Number(updatedForm.bm) +
              Number(updatedForm.ppn) +
              (updatedForm.pph === "" ? 0 : Number(updatedForm.pph))
            : "";
      }

      return updatedForm;
    });
  };

  // Pressing Enter moves to the next editable field
  const handleKeyDown = (event, index) => {
    if (event.key === "Enter") {
      event.preventDefault();

      const nextInput = inputRefs.current
        .slice(index + 1)
        .find(
          (input) =>
            input &&
            !input.readOnly &&
            !input.disabled
        );

      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleSubmit = useCallback(async (event) => {
    // Prevent normal form submission when called by Ctrl + S
    if (event) {
      event.preventDefault();
    }

    // Validate dates
    const dateFields = [
      {
        name: "Arrival Estimation",
        value: form.arrivalEstimation,
      },
      {
        name: "Arrival at Yard",
        value: form.arrivalAtYard,
      },
      {
        name: "PIB Clearance",
        value: form.pibClearanceDate,
      },
    ];

    for (const field of dateFields) {
      if (!isValidDate(field.value)) {
        showToast(`Please enter a valid ${field.name}.`, "error");
        return;
      }
    }

    // Validate required fields
    if (
      !form.blNumber.trim() ||
      !form.invoiceNumber.trim() ||
      !form.vesselName.trim()
    ) {
      showToast(
        "Please fill in BL Number, Invoice Number, and Vessel Name.",
        "error"
      );
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/shipments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create shipment"
        );
      }

      showToast("Shipment created successfully!");

      navigate(`/shipments/${data.shipment.id}`);
    } catch (error) {
      console.error(error);
      showToast(error.message, "error");
    }
  }, [form, navigate, showToast]);

  // Ctrl + S saves the shipment
  useEffect(() => {
    const handleSaveShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();

        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleSaveShortcut);

    return () => {
      window.removeEventListener("keydown", handleSaveShortcut);
    };
  }, [handleSubmit]);

  return (
    <div className="p-4 sm:p-6">
      <button
        type="button"
        onClick={() => navigate("/shipments")}
        className="mb-6 rounded-lg border border-gray-300 px-4 py-2 text-sm sm:text-base hover:bg-gray-50"
      >
        ← Back to Shipments
      </button>
  
      <h1 className="text-2xl font-bold">Add New Shipment</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-5 space-y-6 sm:mt-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">
              Agent
            </label>

            <input
              ref={(element) => {
                inputRefs.current[0] = element;
              }}
              name="agent"
              value={form.agent}
              onChange={handleChange}
              onKeyDown={(event) =>
                handleKeyDown(event, 0)
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 sm:px-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              BL Number <span className="text-red-500">*</span>
            </label>

            <input
              ref={(element) => {
                inputRefs.current[1] = element;
              }}
              name="blNumber"
              value={form.blNumber}
              onChange={handleChange}
              onKeyDown={(event) =>
                handleKeyDown(event, 1)
              }
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 sm:px-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Invoice Number{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              ref={(element) => {
                inputRefs.current[2] = element;
              }}
              name="invoiceNumber"
              value={form.invoiceNumber}
              onChange={handleChange}
              onKeyDown={(event) =>
                handleKeyDown(event, 2)
              }
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 sm:px-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Vessel Name{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              ref={(element) => {
                inputRefs.current[3] = element;
              }}
              name="vesselName"
              value={form.vesselName}
              onChange={handleChange}
              onKeyDown={(event) =>
                handleKeyDown(event, 3)
              }
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 sm:px-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Containers
            </label>

            <input
              ref={(element) => {
                inputRefs.current[4] = element;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="containers"
              value={form.containers}
              onChange={handleChange}
              onKeyDown={(event) =>
                handleKeyDown(event, 4)
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 sm:px-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Units
            </label>

            <input
              type="number"
              name="units"
              value={form.units}
              readOnly
              min="0"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 sm:px-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Arrival Estimation
            </label>

            <input
              ref={(element) => {
                inputRefs.current[5] = element;
              }}
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              name="arrivalEstimation"
              value={form.arrivalEstimation}
              onChange={handleChange}
              onKeyDown={(event) =>
                handleKeyDown(event, 5)
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 sm:px-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Arrival at Yard
            </label>

            <input
              ref={(element) => {
                inputRefs.current[6] = element;
              }}
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              name="arrivalAtYard"
              value={form.arrivalAtYard}
              onChange={handleChange}
              onKeyDown={(event) =>
                handleKeyDown(event, 6)
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 sm:px-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              PIB Clearance
            </label>

            <input
              ref={(element) => {
                inputRefs.current[7] = element;
              }}
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              name="pibClearanceDate"
              value={form.pibClearanceDate}
              onChange={handleChange}
              onKeyDown={(event) =>
                handleKeyDown(event, 7)
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 sm:px-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              BM
            </label>

            <input
              ref={(element) => {
                inputRefs.current[8] = element;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="bm"
              value={form.bm}
              onChange={handleChange}
              onKeyDown={(event) =>
                handleKeyDown(event, 8)
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 sm:px-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              PPN
            </label>

            <input
              ref={(element) => {
                inputRefs.current[9] = element;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="ppn"
              value={form.ppn}
              onChange={handleChange}
              onKeyDown={(event) =>
                handleKeyDown(event, 9)
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 sm:px-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              PPh
            </label>

            <input
              ref={(element) => {
                inputRefs.current[10] = element;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="pph"
              value={form.pph}
              onChange={handleChange}
              onKeyDown={(event) =>
                handleKeyDown(event, 10)
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 sm:px-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Total PIB Payment
            </label>

            <input
              type="number"
              name="totalPibPayment"
              value={form.totalPibPayment}
              readOnly
              min="0"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 sm:px-4"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-black px-5 py-2 text-white hover:bg-gray-800 sm:w-auto"
        >
          Create Shipment
        </button>
      </form>
    </div>
  );
}

export default AddShipment;