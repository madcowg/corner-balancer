import { NavLink, Outlet, useLocation } from "react-router-dom";

import { StepProgress } from "../components/ui/StepProgress";
import { getRouteMeta, parseSessionRoute } from "./routes";
import { useCornerBalanceApp } from "./context";

function OfflineStatus() {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-full border px-3 py-1 text-small font-medium ${
        offline
          ? "border-danger/20 bg-danger/10 text-danger"
          : "border-success/20 bg-success/10 text-success"
      }`}
    >
      {offline ? "Offline, local draft storage active" : "Online, local draft storage active"}
    </div>
  );
}

function SaveStateIndicator() {
  const {
    auth,
    saveStatus,
    cloudSyncStatus,
    cloudSyncMessage,
    lastSavedAt,
    lastCloudSyncAt,
    error
  } = useCornerBalanceApp();

  const title = error ?? cloudSyncMessage;
  const signedIn = auth.mode === "signed_in";
  const statusText =
    saveStatus === "saving"
      ? "Saving local draft"
      : saveStatus === "error"
        ? "Local save needs attention"
        : saveStatus === "sync_pending" || cloudSyncStatus === "error"
          ? "Saved locally, cloud sync needs attention"
          : signedIn && cloudSyncStatus === "waiting_for_guest_sync"
            ? "Guest data is waiting for explicit sync"
            : signedIn && cloudSyncStatus === "connecting"
              ? "Connecting to Firestore"
              : signedIn && cloudSyncStatus === "syncing"
                ? "Syncing to Firestore"
                : signedIn && cloudSyncStatus === "using_cache"
                  ? "Using Firestore cache"
                  : signedIn && cloudSyncStatus === "remote_update"
                    ? "Merged changes from another device"
                    : signedIn && cloudSyncStatus === "conflict"
                      ? "Kept newer local changes"
                      : signedIn && cloudSyncStatus === "synced"
                        ? `Synced ${
                            lastCloudSyncAt
                              ? new Date(lastCloudSyncAt).toLocaleTimeString()
                              : "recently"
                          }`
                        : saveStatus === "saved"
                          ? `Saved ${
                              lastSavedAt
                                ? new Date(lastSavedAt).toLocaleTimeString()
                                : "recently"
                            }`
                          : "Autosave ready";
  const statusTone =
    saveStatus === "error" || cloudSyncStatus === "error"
      ? "border-danger/20 bg-danger/10 text-danger"
      : saveStatus === "sync_pending" ||
          cloudSyncStatus === "waiting_for_guest_sync" ||
          cloudSyncStatus === "using_cache" ||
          cloudSyncStatus === "conflict"
        ? "border-warning/20 bg-warning/10 text-warning"
        : cloudSyncStatus === "synced"
          ? "border-success/20 bg-success/10 text-success"
          : cloudSyncStatus === "remote_update" || cloudSyncStatus === "syncing"
            ? "border-primary/20 bg-primary-tint text-primary"
            : "border-border bg-surface text-muted";

  return (
    <div
      role="status"
      aria-live="polite"
      title={title}
      className={`rounded-full border px-3 py-1 text-small font-medium ${statusTone}`}
    >
      {statusText}
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const app = useCornerBalanceApp();
  const currentRoute = getRouteMeta(location.pathname);
  const sessionRoute = parseSessionRoute(location.pathname);
  const session = sessionRoute ? app.getSession(sessionRoute.sessionId) : undefined;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-primary">
                CornerBalance
              </p>
              <h1 className="mt-1 text-h1 font-bold text-ink">{currentRoute.title}</h1>
              <p className="mt-2 text-body text-muted">{currentRoute.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <OfflineStatus />
              <SaveStateIndicator />
            </div>
          </div>
          <nav aria-label="Primary" className="overflow-x-auto pb-1">
            <ul className="flex min-w-max gap-2">
              {[
                { href: "/", label: "Welcome" },
                { href: "/garage", label: "Garage" },
                { href: "/compare", label: "Compare" }
              ].map((route) => (
                <li key={route.href}>
                  <NavLink
                    to={route.href}
                    className={({ isActive }) =>
                      [
                        "block rounded-full border px-3 py-2 text-small font-semibold transition-colors",
                        isActive
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
                      ].join(" ")
                    }
                  >
                    {route.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {sessionRoute && session ? (
            <StepProgress currentStep={session.currentStep} sessionId={session.id} />
          ) : null}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-card border border-border bg-white/70 p-4">
          <p className="text-caption text-muted">
            Figma reference: <span className="font-semibold text-ink">{currentRoute.figmaFrame}</span>
          </p>
        </section>
        <Outlet />
      </main>
    </div>
  );
}
