import type { Session, Vehicle } from "../../domain/types";
import { buildSessionSummary } from "../../domain/reporting/sessionSummary";

interface ReportPayload {
  exportedAt: string;
  appVersion: string;
  vehicle: Vehicle;
  session: Session;
  summary: ReturnType<typeof buildSessionSummary>;
}

function buildPayload(vehicle: Vehicle, session: Session): ReportPayload {
  return {
    exportedAt: new Date().toISOString(),
    appVersion: "0.1.0",
    vehicle,
    session,
    summary: buildSessionSummary(session)
  };
}

export function buildSessionJson(vehicle: Vehicle, session: Session) {
  return JSON.stringify(buildPayload(vehicle, session), null, 2);
}

export function buildSessionCsv(vehicle: Vehicle, session: Session) {
  const summary = buildSessionSummary(session);
  const rows = [
    ["section", "subject", "session_id", "sequence", "key", "value", "detail"],
    ["vehicle", vehicle.nickname, session.id, "", "primary_use", vehicle.primaryUse, ""],
    ["vehicle", vehicle.nickname, session.id, "", "coilover_type", vehicle.coiloverType, ""],
    ["setup", "session", session.id, "", "event_type", session.setupSnapshot.eventType, ""],
    ["setup", "session", session.id, "", "fuel_description", session.setupSnapshot.fuelDescription, ""],
    [
      "setup",
      "session",
      session.id,
      "",
      "ballast_description",
      session.setupSnapshot.ballastDescription ?? "",
      ""
    ],
    ["setup", "session", session.id, "", "sway_bar_state", session.setupSnapshot.swayBarState, ""],
    [
      "summary",
      "session",
      session.id,
      "",
      "baseline_cross_pct",
      formatCsvMetric(summary.baselineCrossPct),
      ""
    ],
    [
      "summary",
      "session",
      session.id,
      "",
      "final_cross_pct",
      formatCsvMetric(summary.finalCrossPct),
      ""
    ],
    [
      "summary",
      "session",
      session.id,
      "",
      "cross_change_pct",
      formatCsvMetric(summary.crossChangePct),
      ""
    ],
    [
      "summary",
      "session",
      session.id,
      "",
      "final_cross_error_pct",
      formatCsvMetric(summary.finalCrossErrorPct),
      ""
    ],
    [
      "summary",
      "session",
      session.id,
      "",
      "within_cross_tolerance",
      String(summary.withinCrossTolerance ?? false),
      ""
    ],
    ["summary", "session", session.id, "", "measurement_count", String(summary.measurementCount), ""],
    ["summary", "session", session.id, "", "adjustment_count", String(summary.adjustmentCount), ""],
    ["summary", "session", session.id, "", "warning_count", String(summary.warningCount), ""],
    [
      "summary",
      "safety_checklist",
      session.id,
      "",
      "unresolved_count",
      String(summary.safetyChecklist.unresolved),
      ""
    ],
    [
      "summary",
      "final_checklist",
      session.id,
      "",
      "unresolved_count",
      String(summary.finalChecklist.unresolved),
      ""
    ]
  ];

  session.safetyChecklist.forEach((item) => {
    rows.push([
      "checklist",
      "safety",
      session.id,
      "",
      item.id,
      item.checked ? "checked" : "unchecked",
      [item.severity, item.overrideReason ?? ""].filter(Boolean).join(" | ")
    ]);
  });

  session.finalChecklist.forEach((item) => {
    rows.push([
      "checklist",
      "final",
      session.id,
      "",
      item.id,
      item.checked ? "checked" : "unchecked",
      [item.severity, item.overrideReason ?? ""].filter(Boolean).join(" | ")
    ]);
  });

  session.measurements.forEach((measurement) => {
    rows.push(
      ["measurement", "corner_weight", session.id, String(measurement.sequence), "LF_kg", measurement.weightsKg.LF.toFixed(4), ""],
      ["measurement", "corner_weight", session.id, String(measurement.sequence), "RF_kg", measurement.weightsKg.RF.toFixed(4), ""],
      ["measurement", "corner_weight", session.id, String(measurement.sequence), "LR_kg", measurement.weightsKg.LR.toFixed(4), ""],
      ["measurement", "corner_weight", session.id, String(measurement.sequence), "RR_kg", measurement.weightsKg.RR.toFixed(4), ""],
      [
        "measurement",
        "calculation",
        session.id,
        String(measurement.sequence),
        "selected_cross_pct",
        measurement.calculations.selectedCrossPct.toFixed(4),
        ""
      ],
      [
        "measurement",
        "calculation",
        session.id,
        String(measurement.sequence),
        "cross_error_pct",
        measurement.calculations.crossErrorPct.toFixed(4),
        ""
      ],
      [
        "measurement",
        "calculation",
        session.id,
        String(measurement.sequence),
        "total_kg",
        measurement.calculations.totalKg.toFixed(4),
        ""
      ]
    );

    if (measurement.calculations.rakeMm != null) {
      rows.push([
        "measurement",
        "calculation",
        session.id,
        String(measurement.sequence),
        "rake_mm",
        measurement.calculations.rakeMm.toFixed(4),
        ""
      ]);
    }

    if (measurement.rideHeightsMm) {
      rows.push(
        ["measurement", "ride_height", session.id, String(measurement.sequence), "LF_mm", measurement.rideHeightsMm.LF.toFixed(4), ""],
        ["measurement", "ride_height", session.id, String(measurement.sequence), "RF_mm", measurement.rideHeightsMm.RF.toFixed(4), ""],
        ["measurement", "ride_height", session.id, String(measurement.sequence), "LR_mm", measurement.rideHeightsMm.LR.toFixed(4), ""],
        ["measurement", "ride_height", session.id, String(measurement.sequence), "RR_mm", measurement.rideHeightsMm.RR.toFixed(4), ""]
      );
    }

    if (measurement.tirePressuresPsi) {
      rows.push(
        ["measurement", "tire_pressure", session.id, String(measurement.sequence), "LF_psi", measurement.tirePressuresPsi.LF.toFixed(4), ""],
        ["measurement", "tire_pressure", session.id, String(measurement.sequence), "RF_psi", measurement.tirePressuresPsi.RF.toFixed(4), ""],
        ["measurement", "tire_pressure", session.id, String(measurement.sequence), "LR_psi", measurement.tirePressuresPsi.LR.toFixed(4), ""],
        ["measurement", "tire_pressure", session.id, String(measurement.sequence), "RR_psi", measurement.tirePressuresPsi.RR.toFixed(4), ""]
      );
    }

    measurement.warnings.forEach((warning) => {
      rows.push([
        "measurement_warning",
        "warning",
        session.id,
        String(measurement.sequence),
        "warning",
        warning,
        ""
      ]);
    });
  });

  session.adjustments.forEach((adjustment, index) => {
    rows.push([
      "adjustment",
      adjustment.corner,
      session.id,
      String(index),
      adjustment.adjusterType,
      `${adjustment.direction} ${adjustment.amount} ${adjustment.amountUnit}`,
      adjustment.reason
    ]);
  });

  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

function formatCsvMetric(value?: number) {
  return value == null ? "" : value.toFixed(4);
}

function escapeCsvValue(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

export async function buildSessionPdf(vehicle: Vehicle, session: Session) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const payload = buildPayload(vehicle, session);
  const summary = payload.summary;
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([612, 792]);
  let y = 748;

  const addLine = (text: string, size = 10, useBold = false) => {
    if (y < 54) {
      page = pdf.addPage([612, 792]);
      y = 748;
    }

    page.drawText(text, {
      x: 48,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0.11, 0.15, 0.2)
    });
    y -= size >= 14 ? 22 : 16;
  };

  addLine("CornerBalance Session Report", 20, true);
  addLine(`Vehicle: ${vehicle.nickname}`, 12);
  addLine(`Session ID: ${session.id}`);
  addLine(`Status: ${session.status}`);
  addLine(`Exported: ${payload.exportedAt}`);
  y -= 8;

  addLine("Setup Snapshot", 14, true);
  addLine(`Event type: ${session.setupSnapshot.eventType}`);
  addLine(`Fuel: ${session.setupSnapshot.fuelDescription}`);
  addLine(`Ballast: ${session.setupSnapshot.ballastDescription ?? "Not specified"}`);
  addLine(`Sway bar: ${session.setupSnapshot.swayBarState}`);
  addLine(`Target cross: ${session.targetCrossPct.toFixed(2)}% ± ${session.crossTolerancePct.toFixed(2)}%`);
  y -= 8;

  addLine("Summary", 14, true);
  addLine(`Baseline cross: ${summary.baselineCrossPct?.toFixed(2) ?? "--"}%`);
  addLine(`Final cross: ${summary.finalCrossPct?.toFixed(2) ?? "--"}%`);
  addLine(`Cross change: ${formatSigned(summary.crossChangePct, "%")}`);
  addLine(`Final cross error: ${formatSigned(summary.finalCrossErrorPct, "%")}`);
  addLine(`Within tolerance: ${summary.withinCrossTolerance ? "Yes" : "No"}`);
  addLine(`Total weight change: ${formatSigned(summary.totalChangeKg, " kg")}`);
  addLine(`Rake change: ${formatSigned(summary.rakeChangeMm, " mm")}`);
  addLine(`Measurements: ${summary.measurementCount}`);
  addLine(`Adjustments: ${summary.adjustmentCount}`);
  y -= 8;

  addLine("Checklist State", 14, true);
  addLine(
    `Safety unresolved: ${summary.safetyChecklist.unresolved} (overrides: ${summary.safetyChecklist.overridden})`
  );
  addLine(
    `Final unresolved: ${summary.finalChecklist.unresolved} (overrides: ${summary.finalChecklist.overridden})`
  );

  if (summary.latestWarnings.length > 0) {
    y -= 8;
    addLine("Latest warnings", 14, true);
    summary.latestWarnings.forEach((warning) => addLine(`- ${warning}`));
  }

  y -= 8;
  addLine("Adjustments", 14, true);
  if (session.adjustments.length === 0) {
    addLine("No adjustments recorded.");
  } else {
    session.adjustments.forEach((adjustment, index) => {
      addLine(
        `${index + 1}. ${adjustment.corner} ${adjustment.direction} ${adjustment.amount} ${adjustment.amountUnit} - ${adjustment.reason}`
      );
    });
  }

  return pdf.save();
}

function formatSigned(value: number | undefined, suffix: string) {
  if (value == null) {
    return `--${suffix}`;
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}${suffix}`;
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
