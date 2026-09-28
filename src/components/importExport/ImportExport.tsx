
import { ChangeEvent, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  FileJson,
  FileSpreadsheet,
  Upload,
} from "lucide-react";

import {
  exportToExcel,
  exportToCsv,
  exportToJson,
  parseExcelOrCsv,
  parseJson,
  ImportExportColumn,
} from "../../utils/importExport";

type ImportType = "excel" | "csv" | "json";

interface Toast {
  success?: (message: string) => void;
  error?: (message: string) => void;
  info?: (message: string) => void;
}

interface ImportExportProps<T extends Record<string, unknown>> {
  data?: T[];
  columns?: ImportExportColumn<T>[];
  fileName?: string;

  
  onImport?: (
    data: Record<string, unknown>[],
    file: File,
  ) => Promise<void>;

  toast?: Toast;

  disabled?: boolean;
}

const ImportExport = <T extends Record<string, unknown>>({
  data = [],
  columns = [],
  fileName = "export",
  onImport,
  toast,
  disabled = false,
}: ImportExportProps<T>) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  const showSuccess = (message: string): void => {
    toast?.success?.(message);
  };

  const showError = (message: string): void => {
    toast?.error?.(message);
  };

  const showInfo = (message: string): void => {
    toast?.info?.(message);
  };

  /**
   * Export Excel / CSV / JSON
   */
  const handleExport = (type: ImportType): void => {
    if (loading || disabled) {
      return;
    }

    try {
      if (!data.length) {
        showInfo("No data available to export.");
        return;
      }

      if (!columns.length && type !== "json") {
        showError("Export columns are not configured.");
        return;
      }

      switch (type) {
        case "excel":
          exportToExcel(data, columns, fileName);
          showSuccess("Excel file exported successfully.");
          break;

        case "csv":
          exportToCsv(data, columns, fileName);
          showSuccess("CSV file exported successfully.");
          break;

        case "json":
          exportToJson(data, fileName);
          showSuccess("JSON file exported successfully.");
          break;
      }

      setOpen(false);
    } catch (error) {
      console.error("Export error:", error);

      showError(
        error instanceof Error
          ? error.message
          : "Failed to export data.",
      );
    }
  };

  /**
   * Import Excel / CSV / JSON
   */
  const handleImport = async (
    event: ChangeEvent<HTMLInputElement>,
    type: ImportType,
  ): Promise<void> => {
    const file = event.target.files?.[0];

    // Allow selecting the same file again
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!onImport) {
      showError("Import API callback is not configured.");
      return;
    }

    setLoading(true);

    try {
      let importedData: Record<string, unknown>[] = [];

      if (type === "excel" || type === "csv") {
        importedData = await parseExcelOrCsv(file);
      }

      if (type === "json") {
        importedData = await parseJson(file);
      }

      if (!Array.isArray(importedData)) {
        throw new Error("Invalid imported data.");
      }

      if (!importedData.length) {
        throw new Error(
          "The selected file contains no records.",
        );
      }

      // Send parsed data to parent/API callback
      await onImport(importedData, file);

      showSuccess(
        `${importedData.length} record${
          importedData.length > 1 ? "s" : ""
        } imported successfully.`,
      );

      setOpen(false);
    } catch (error: unknown) {
      console.error("Import error:", error);

      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
            };
          };
        };

        const apiMessage =
          axiosError.response?.data?.message;

        if (apiMessage) {
          showError(apiMessage);
          return;
        }
      }

      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError("Failed to import data.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="position-relative d-inline-block">
      {/* Main Button */}
      <button
        type="button"
        className="btn btn-outline-primary d-flex align-items-center gap-2"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled || loading}
      >
        {loading ? (
          <>
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            />

            Processing...
          </>
        ) : (
          <>
            <Upload size={17} />

            Import / Export

            <ChevronDown
              size={16}
              className={open ? "rotate-180" : ""}
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && !loading && (
        <div
          className="dropdown-menu show shadow border-0 p-2"
          style={{
            minWidth: "220px",
            right: 0,
            left: "auto",
          }}
        >
          {/* Import */}
          <div className="dropdown-header">
            Import
          </div>

          <button
            type="button"
            className="dropdown-item d-flex align-items-center gap-2"
            onClick={() =>
              excelInputRef.current?.click()
            }
          >
            <FileSpreadsheet size={16} />

            Import Excel
          </button>

          <button
            type="button"
            className="dropdown-item d-flex align-items-center gap-2"
            onClick={() =>
              csvInputRef.current?.click()
            }
          >
            <FileSpreadsheet size={16} />

            Import CSV
          </button>

          <button
            type="button"
            className="dropdown-item d-flex align-items-center gap-2"
            onClick={() =>
              jsonInputRef.current?.click()
            }
          >
            <FileJson size={16} />

            Import JSON
          </button>

          <div className="dropdown-divider" />

          {/* Export */}
          <div className="dropdown-header">
            Export
          </div>

          <button
            type="button"
            className="dropdown-item d-flex align-items-center gap-2"
            onClick={() => handleExport("excel")}
          >
            <Download size={16} />

            Export Excel
          </button>

          <button
            type="button"
            className="dropdown-item d-flex align-items-center gap-2"
            onClick={() => handleExport("csv")}
          >
            <Download size={16} />

            Export CSV
          </button>

          <button
            type="button"
            className="dropdown-item d-flex align-items-center gap-2"
            onClick={() => handleExport("json")}
          >
            <Download size={16} />

            Export JSON
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}

      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="d-none"
        onChange={(event) =>
          handleImport(event, "excel")
        }
      />

      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="d-none"
        onChange={(event) =>
          handleImport(event, "csv")
        }
      />

      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        className="d-none"
        onChange={(event) =>
          handleImport(event, "json")
        }
      />
    </div>
  );
};

export default ImportExport;
