import type { SessionFlowStep } from "../domain/types";

export interface RouteMeta {
  key: string;
  label: string;
  title: string;
  summary: string;
  figmaFrame: string;
}

export const topLevelRouteMeta: Record<string, RouteMeta> = {
  "/": {
    key: "welcome",
    label: "Welcome",
    title: "Welcome and resume",
    summary: "Entry point for guest mode, account auth handoff, and resuming the latest saved local session.",
    figmaFrame: "05_MOBILE_SCREENS/Welcome"
  },
  "/garage": {
    key: "garage",
    label: "Garage",
    title: "Vehicle garage",
    summary: "Stores vehicle profiles, suspension architecture, notes, and preferred working units.",
    figmaFrame: "05_MOBILE_SCREENS/Garage"
  },
  "/compare": {
    key: "compare",
    label: "Compare",
    title: "Session comparison",
    summary: "Compares saved sessions side by side while keeping historical records immutable.",
    figmaFrame: "05_MOBILE_SCREENS/Compare"
  }
};

export const sessionRouteMeta: Record<SessionFlowStep, RouteMeta> = {
  setup: {
    key: "setup",
    label: "Setup",
    title: "Session setup",
    summary: "Defines the loaded condition, targets, tolerances, pressures, damper notes, and desired ride heights.",
    figmaFrame: "05_MOBILE_SCREENS/Session Setup"
  },
  workspace: {
    key: "workspace",
    label: "Workspace",
    title: "Workspace and safety",
    summary: "Runs the critical pad-plane and scale-area safety gates before rolling onto the scales.",
    figmaFrame: "05_MOBILE_SCREENS/Workspace"
  },
  "vehicle-prep": {
    key: "vehicle-prep",
    label: "Prep",
    title: "Vehicle preparation",
    summary: "Captures pressure, ride-height marks, ballast, fuel, and sway-bar state before measurement.",
    figmaFrame: "05_MOBILE_SCREENS/Vehicle Prep"
  },
  baseline: {
    key: "baseline",
    label: "Baseline",
    title: "Baseline measurement",
    summary: "Captures four-corner weights, ride heights, pressure state, settling confirmation, and notes.",
    figmaFrame: "05_MOBILE_SCREENS/Baseline"
  },
  results: {
    key: "results",
    label: "Results",
    title: "Results dashboard",
    summary: "Shows totals, percentages, diagonals, ride-height deltas, warnings, and iteration state.",
    figmaFrame: "05_MOBILE_SCREENS/Results"
  },
  adjust: {
    key: "adjust",
    label: "Adjust",
    title: "Adjustment assistant",
    summary: "Logs one measured change while explaining only expected qualitative diagonal effects.",
    figmaFrame: "05_MOBILE_SCREENS/Adjustment"
  },
  settle: {
    key: "settle",
    label: "Settle",
    title: "Resettle and remeasure",
    summary: "Requires a repeatable settling checklist before another measurement becomes valid.",
    figmaFrame: "05_MOBILE_SCREENS/Resettle"
  },
  finalize: {
    key: "finalize",
    label: "Finalize",
    title: "Finalization",
    summary: "Tracks torque, locked collars, neutral sway links, wheel installation, and alignment status.",
    figmaFrame: "05_MOBILE_SCREENS/Finalization"
  },
  report: {
    key: "report",
    label: "Report",
    title: "Report and export",
    summary: "Summarizes the full session and prepares JSON, CSV, and PDF export actions.",
    figmaFrame: "05_MOBILE_SCREENS/Report"
  }
};

const sessionRoutePattern = /^\/session\/([^/]+)\/([^/]+)$/;

export function parseSessionRoute(pathname: string) {
  const match = sessionRoutePattern.exec(pathname);
  if (!match) {
    return undefined;
  }

  const [, sessionId, step] = match;
  if (!step || !(step in sessionRouteMeta)) {
    return undefined;
  }

  return {
    sessionId: sessionId!,
    step: step as SessionFlowStep
  };
}

export function getRouteMeta(pathname: string) {
  const sessionRoute = parseSessionRoute(pathname);
  if (sessionRoute) {
    return sessionRouteMeta[sessionRoute.step];
  }

  return topLevelRouteMeta[pathname] ?? topLevelRouteMeta["/"]!;
}
