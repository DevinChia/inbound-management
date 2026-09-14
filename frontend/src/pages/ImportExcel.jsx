import { useRef, useState } from "react";

function ImportExcel() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setMessage("Please select an Excel file.");
      return;
    }

    setIsImporting(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://localhost:5000/api/shipments/import",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && data.errors.length > 0) {
            const groupedErrors = {};
    
            data.errors.forEach((error) => {
                const key =
                    `${error.blNumber}|${error.invoiceNumber}`;
    
                if (!groupedErrors[key]) {
                    groupedErrors[key] = {
                        blNumber: error.blNumber,
                        invoiceNumber: error.invoiceNumber,
                        messages: [],
                    };
                }
    
                groupedErrors[key].messages.push({
                    message: error.message,
                    details: error.details,
                });
            });
    
            const errorDetails = Object.values(groupedErrors)
                .map((error, index) => {
                    const messages = error.messages
                        .map((item) =>
                            `${item.message}\n${item.details}`
                        )
                        .join("\n");
    
                    return [
                        `${index + 1}.`,
                        `BL: ${error.blNumber || "-"}`,
                        `Invoice: ${error.invoiceNumber || "-"}`,
                        messages,
                    ].join("\n");
                })
                .join("\n\n");
    
            throw new Error(
                `${data.message}\n\n${errorDetails}`
            );
        }
    
        throw new Error(data.message || "Import failed");
      }

      setMessage(
        `${data.message}. Added: ${data.added}, updated: ${data.updated}, skipped: ${data.skipped}.`
      );

      setFile(null);
      fileInputRef.current.value = "";
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Import Excel</h1>

      <p className="mt-1 text-gray-600">
        Upload an Excel file to add shipments to the system.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5 max-w-xl space-y-4 sm:mt-6"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(event) => setFile(event.target.files[0])}
          disabled={isImporting}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:file:mr-4 sm:file:px-4"
        />

        <button
          type="submit"
          disabled={isImporting}
          className="w-full rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isImporting ? "Importing..." : "Upload"}
        </button>
      </form>

      {message && (
        <p className="mt-4 whitespace-pre-line rounded-lg bg-gray-100 px-3 py-3 text-sm text-gray-700 sm:px-4">
          {message}
        </p>
      )}
    </div>
  );
}

export default ImportExcel;