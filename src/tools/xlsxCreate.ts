/**
 * XLSX creation tool - generates Excel spreadsheets from structured data
 */

import * as XLSX from "xlsx";

export interface XlsxCreateInput {
  sheets: Array<{
    name: string;
    data: Array<Record<string, string | number | boolean | Date>>;
    headers?: string[];
  }>;
  options?: {
    creator?: string;
    company?: string;
    subject?: string;
  };
}

export interface XlsxCreateOutput {
  data: string; // base64 encoded XLSX
  filename: string;
  sheetCount: number;
  rowCount: number;
}

export const xlsxCreateSchema = {
  name: "xlsx/create",
  description:
    "Create an Excel (.xlsx) spreadsheet from structured data. Supports multiple sheets with headers. " +
    "Returns base64-encoded XLSX data.",
  inputSchema: {
    type: "object",
    properties: {
      sheets: {
        type: "array",
        description: "Array of sheets to create",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Sheet name (max 31 chars, no special chars)",
            },
            data: {
              type: "array",
              description: "Array of row objects (key-value pairs)",
              items: {
                type: "object",
                additionalProperties: {
                  anyOf: [
                    { type: "string" },
                    { type: "number" },
                    { type: "boolean" },
                    { type: "string", format: "date-time" },
                  ],
                },
              },
            },
            headers: {
              type: "array",
              items: { type: "string" },
              description: "Optional: custom header order (uses data keys if not provided)",
            },
          },
          required: ["name", "data"],
        },
      },
      options: {
        type: "object",
        properties: {
          creator: { type: "string" },
          company: { type: "string" },
          subject: { type: "string" },
        },
      },
    },
    required: ["sheets"],
  },
};

export async function xlsxCreate(input: XlsxCreateInput): Promise<XlsxCreateOutput> {
  const workbook = XLSX.utils.book_new();

  let totalRows = 0;

  for (const sheet of input.sheets) {
    // Clean sheet name (Excel has restrictions)
    const sheetName = sheet.name
      .replace(/[\\/*?:\[\]]/g, "_")
      .substring(0, 31);

    // Convert data to worksheet
    let worksheet: XLSX.WorkSheet;

    if (sheet.data.length === 0) {
      // Empty sheet
      worksheet = XLSX.utils.aoa_to_sheet([[]]);
    } else {
      // Use custom headers if provided, otherwise extract from data keys
      const headers =
        sheet.headers || Object.keys(sheet.data[0]);

      // Create array of arrays with headers first
      const dataRows = sheet.data.map((row) =>
        headers.map((h) => {
          const val = row[h];
          return val === undefined || val === null ? "" : val;
        })
      );

      const allData = [headers, ...dataRows];
      worksheet = XLSX.utils.aoa_to_sheet(allData);

      // Set column widths based on content
      const colWidths = headers.map((h, idx) => {
        const headerLen = h.length;
        const maxDataLen = dataRows.reduce((max, row) => {
          const cellVal = String(row[idx] || "");
          return Math.max(max, cellVal.length);
        }, 0);
        return { wch: Math.max(headerLen, maxDataLen) + 2 };
      });
      worksheet["!cols"] = colWidths;

      totalRows += sheet.data.length;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  // Set metadata
  if (input.options) {
    workbook.Props = {
      Author: input.options.creator,
      Company: input.options.company,
      Subject: input.options.subject,
    };
  }

  // Generate output
  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return {
    data: Buffer.from(buffer).toString("base64"),
    filename: "spreadsheet.xlsx",
    sheetCount: input.sheets.length,
    rowCount: totalRows,
  };
}
