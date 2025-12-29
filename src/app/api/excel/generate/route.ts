import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { Buffer } from "node:buffer";
import { getServerSupabase } from "@/lib/supabase-server";

type Mapping = Record<string, string>;

function normalizeCellValue(value: unknown): ExcelJS.CellValue {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  ) {
    return value;
  }
  return JSON.stringify(value);
}

function setCell(workbook: ExcelJS.Workbook, reference: string, value: unknown) {
  const [sheetName, cell] = reference.split("!");
  if (!sheetName || !cell) return;
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) return;
  sheet.getCell(cell).value = normalizeCellValue(value);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const templateId = typeof body?.template_id === "string" ? body.template_id : "";
  const fields = typeof body?.fields === "object" ? body.fields : {};

  if (!templateId) {
    return NextResponse.json({ error: "Missing template_id." }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("templates")
    .select("workbook_base64, mapping_json, name")
    .eq("id", templateId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const workbook = new ExcelJS.Workbook();
  const buffer = Buffer.from(data.workbook_base64, "base64") as Buffer;
  await workbook.xlsx.load(buffer);

  const mapping = (data.mapping_json ?? {}) as Mapping;
  Object.entries(mapping).forEach(([key, cell]) => {
    if (!cell) return;
    const value = fields[key];
    if (value === undefined || value === null) return;
    setCell(workbook, cell, value);
  });

  const output = await workbook.xlsx.writeBuffer();
  return new NextResponse(output, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${data.name}.xlsx"`,
    },
  });
}
