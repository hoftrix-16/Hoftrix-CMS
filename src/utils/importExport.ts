import * as XLSX from "xlsx";

export interface ImportExportColumn<T extends Record<string, unknown>> {
  key: keyof T;
  label: string;
}

type ImportExportRow = Record<string, unknown>;


export const exportToExcel = <T extends Record<string, unknown>>(
  data: T[],
  columns: ImportExportColumn<T>[],
  fileName = "export",
): void => {
  const rows = data.map((item) => {
    const row: Record<string, unknown> = {};

    columns.forEach(({ key, label }) => {
      row[label] = item[key] ?? "";
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Export data to CSV
 */
export const exportToCsv = <T extends Record<string, unknown>>(
  data: T[],
  columns: ImportExportColumn<T>[],
  fileName = "export",
): void => {
  const rows = data.map((item) => {
    const row: Record<string, unknown> = {};

    columns.forEach(({ key, label }) => {
      row[label] = item[key] ?? "";
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  downloadBlob(blob, `${fileName}.csv`);
};

/**
 * Export data to JSON
 */
export const exportToJson = <T>(
  data: T[],
  fileName = "export",
): void => {
  const json = JSON.stringify(data, null, 2);

  const blob = new Blob([json], {
    type: "application/json;charset=utf-8;",
  });

  downloadBlob(blob, `${fileName}.json`);
};

/**
 * Import Excel or CSV file
 */
export const parseExcelOrCsv = async (
  file: File,
): Promise<ImportExportRow[]> => {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
  });

  if (!workbook.SheetNames.length) {
    throw new Error("The file does not contain any sheet.");
  }

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    throw new Error("Unable to read the first sheet.");
  }

  return XLSX.utils.sheet_to_json<ImportExportRow>(firstSheet, {
    defval: "",
  });
};

/**
 * Import JSON file
 */
export const parseJson = async (
  file: File,
): Promise<ImportExportRow[]> => {
  const text = await file.text();

  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "JSON file must contain an array of records.",
    );
  }

  return data as ImportExportRow[];
};

/**
 * Download Blob as a file
 */
const downloadBlob = (
  blob: Blob,
  fileName: string,
): void => {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
};