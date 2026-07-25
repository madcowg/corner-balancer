import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "./AppShell";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import("../features/auth/WelcomeScreen")).WelcomeScreen
        })
      },
      {
        path: "garage",
        lazy: async () => ({
          Component: (await import("../features/garage/GarageScreen")).GarageScreen
        })
      },
      {
        path: "compare",
        lazy: async () => ({
          Component: (await import("../features/compare/CompareScreen")).CompareScreen
        })
      },
      {
        path: "session/:sessionId/setup",
        lazy: async () => ({
          Component: (await import("../features/session/SessionScreens")).SessionSetupScreen
        })
      },
      {
        path: "session/:sessionId/workspace",
        lazy: async () => ({
          Component: (await import("../features/session/SessionScreens")).WorkspaceScreen
        })
      },
      {
        path: "session/:sessionId/vehicle-prep",
        lazy: async () => ({
          Component: (await import("../features/session/SessionScreens")).VehiclePrepScreen
        })
      },
      {
        path: "session/:sessionId/baseline",
        lazy: async () => ({
          Component: (await import("../features/session/SessionScreens")).BaselineScreen
        })
      },
      {
        path: "session/:sessionId/results",
        lazy: async () => ({
          Component: (await import("../features/session/SessionScreens")).ResultsScreen
        })
      },
      {
        path: "session/:sessionId/adjust",
        lazy: async () => ({
          Component: (await import("../features/session/SessionScreens")).AdjustmentScreen
        })
      },
      {
        path: "session/:sessionId/settle",
        lazy: async () => ({
          Component: (await import("../features/session/SessionScreens")).SettleScreen
        })
      },
      {
        path: "session/:sessionId/finalize",
        lazy: async () => ({
          Component: (await import("../features/session/SessionScreens")).FinalizationScreen
        })
      },
      {
        path: "session/:sessionId/report",
        lazy: async () => ({
          Component: (await import("../features/session/SessionScreens")).ReportScreen
        })
      }
    ]
  }
]);
