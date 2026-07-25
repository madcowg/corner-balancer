import type { Session, Vehicle } from "../../domain/types";

interface ReportPayload {
  exportedAt: string;
  appVersion: string;
  vehicle: Vehicle;
  session: Session;
}

function buildPayload(vehicle: Vehicle, session: Session): ReportPayload {
  return {
    exportedAt: new Date().toISOString(),
    appVersion: "0.1.0",
    vehicle,
    session
  };
}

export function buildSessionJson(vehicle: Vehicle, session: Session) {
  return JSON.stringify(buildPayload(vehicle, session), null, 2);
}

export function buildSessionCsv(vehicle: Vehicle, session: Session) {
  const rows = [
    ["section", "vehicle", "session_id", "status", "measurement_sequence", "corner_or_metric", "value"],
    ["vehicle", vehicle.nickname, session.id, session.status, "", "primary_use", vehicle.primaryUse],
    ["vehicle", vehicle.nickname, session.id, session.status, "", "coilover_type", vehicle.coiloverType]
  ];

  session.measurements.forEach((measurement) => {
    rows.push(
      ["measurement", vehicle.nickname, session.id, session.status, String(measurement.sequence), "LF_kg", measurement.weightsKg.LF.toFixed(4)],
      ["measurement", vehicle.nickname, session.id, session.status, String(measurement.sequence), "RF_kg", measurement.weightsKg.RF.toFixed(4)],
      ["measurement", vehicle.nickname, session.id, session.status, String(measurement.sequence), "LR_kg", measurement.weightsKg.LR.toFixed(4)],
      ["measurement", vehicle.nickname, session.id, session.status, String(measurement.sequence), "RR_kg", measurement.weightsKg.RR.toFixed(4)],
      [
        "measurement",
        vehicle.nickname,
        session.id,
        session.status,
        String(measurement.sequence),
        "selected_cross_pct",
        measurement.calculations.selectedCrossPct.toFixed(4)
      ]
    );
  });

  session.adjustments.forEach((adjustment, index) => {
    rows.push([
      "adjustment",
      vehicle.nickname,
      session.id,
      session.status,
      String(index),
      adjustment.corner,
      `${adjustment.direction} ${adjustment.amount} ${adjustment.amountUnit}`
    ]);
  });

  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

function escapeCsvValue(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

export async function buildSessionPdf(vehicle: Vehicle, session: Session) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const payload = buildPayload(vehicle, session);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 748;
  page.drawText("CornerBalance Session Report", {
    x: 48,
    y,
    size: 20,
    font: bold,
    color: rgb(0.11, 0.15, 0.2)
  });
  y -= 30;
  page.drawText(`Vehicle: ${vehicle.nickname}`, { x: 48, y, size: 12, font });
  y -= 18;
  page.drawText(`Session ID: ${session.id}`, { x: 48, y, size: 10, font });
  y -= 18;
  page.drawText(`Status: ${session.status}`, { x: 48, y, size: 10, font });
  y -= 18;
  page.drawText(`Exported: ${payload.exportedAt}`, { x: 48, y, size: 10, font });
  y -= 26;

  const latestMeasurement = session.measurements.at(-1);
  const baselineMeasurement = session.measurements[0];
  const summaryLines = [
    `Baseline cross: ${baselineMeasurement?.calculations.selectedCrossPct.toFixed(2) ?? "--"}%`,
    `Final cross: ${latestMeasurement?.calculations.selectedCrossPct.toFixed(2) ?? "--"}%`,
    `Measurements: ${session.measurements.length}`,
    `Adjustments: ${session.adjustments.length}`
  ];

  summaryLines.forEach((line) => {
    page.drawText(line, { x: 48, y, size: 11, font });
    y -= 18;
  });

  y -= 12;
  page.drawText("Adjustments", { x: 48, y, size: 14, font: bold });
  y -= 20;
  if (session.adjustments.length === 0) {
    page.drawText("No adjustments recorded.", { x: 48, y, size: 10, font });
  } else {
    session.adjustments.slice(0, 16).forEach((adjustment, index) => {
      page.drawText(
        `${index + 1}. ${adjustment.corner} ${adjustment.direction} ${adjustment.amount} ${adjustment.amountUnit} - ${adjustment.reason}`,
        { x: 48, y, size: 10, font }
      );
      y -= 16;
    });
  }

  return pdf.save();
}

export function downloadTextFile(filename: string, mimeType: string, content: string) {
  const blob = new Blob([content], { type: mimeType });
  triggerDownload(filename, blob);
}

export function downloadBinaryFile(filename: string, mimeType: string, bytes: Uint8Array) {
  const normalizedBytes = Uint8Array.from(bytes);
  const blob = new Blob([normalizedBytes], { type: mimeType });
  triggerDownload(filename, blob);
}

function triggerDownload(filename: string, blob: Blob) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
