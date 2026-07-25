import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { supportingAssets } from "../../assets/registry";
import { CornerDiagram } from "../../components/illustrations/CornerDiagram";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useCornerBalanceApp } from "../../app/context";
import { buildSessionStepPath } from "../../components/ui/buildSessionStepPath";
import { getLatestNonArchivedSession, getSessionLaunchStep } from "../../domain/workflow/sessionHistory";

export function WelcomeScreen() {
  const navigate = useNavigate();
  const app = useCornerBalanceApp();
  const [email, setEmail] = useState("");
  const preferredLastSession = app.lastSessionId ? app.getSession(app.lastSessionId) : undefined;
  const lastSession =
    preferredLastSession?.status !== "archived"
      ? preferredLastSession
      : getLatestNonArchivedSession(app.sessions);

  if (!app.ready) {
    return (
      <SurfaceCard title="Loading local workshop state" eyebrow="Welcome">
        <p className="mt-2 text-body text-muted">
          Reading saved vehicles and in-progress sessions from local storage.
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <SurfaceCard title="Resume the guided workflow" eyebrow="Welcome">
          <p className="mt-2 text-body text-muted">
            CornerBalance is ready for guest-mode work now. When Firebase environment variables are
            present, Google sign-in, email-link sign-in, anonymous auth, and Firestore sync become
            available on top of the same local-first session model.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => navigate("/garage")}>Continue in guest mode</Button>
            <Button
              variant="secondary"
              disabled={!app.firebaseConfigured}
              onClick={() => void app.signInWithGoogle()}
            >
              Sign in with Google
            </Button>
            <Button
              variant="secondary"
              disabled={!app.firebaseConfigured}
              onClick={() => void app.signInAnonymously()}
            >
              Anonymous auth
            </Button>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 flex-1 rounded-2xl border border-border bg-white px-3 py-3 text-body text-ink"
              placeholder="you@example.com"
            />
            <Button
              variant="secondary"
              disabled={!app.firebaseConfigured || !email.trim()}
              onClick={() => void app.requestEmailLink(email)}
            >
              Send email link
            </Button>
          </div>
          <p className="mt-3 text-small text-muted">
            {app.firebaseConfigured
              ? "Firebase is configured for this environment. Guest data can stay local or be explicitly synced to Firestore after sign-in."
              : "Firebase is not configured yet, so guest mode remains active and auth actions stay disabled."}
          </p>
          {app.auth.mode === "signed_in" ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusBadge tone="success">{app.auth.email ?? app.auth.uid ?? "Signed in"}</StatusBadge>
              <Button variant="secondary" onClick={() => void app.signOut()}>
                Sign out
              </Button>
              {app.auth.pendingGuestSync ? (
                <Button onClick={() => void app.syncGuestDataToCloud()}>
                  Sync guest data to Firestore
                </Button>
              ) : null}
            </div>
          ) : null}
        </SurfaceCard>

        {lastSession ? (
          <SurfaceCard title="Resume last local session" eyebrow="Autosave">
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge tone="info">{lastSession.currentStep}</StatusBadge>
              <StatusBadge tone="neutral">{lastSession.status}</StatusBadge>
            </div>
            <p className="mt-3 text-body text-muted">
              Reopen exactly where you left off. Local draft persistence is already active.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  navigate(buildSessionStepPath(lastSession.id, getSessionLaunchStep(lastSession)))
                }
              >
                {lastSession.status === "complete" || lastSession.status === "alignment_pending"
                  ? "Open latest report"
                  : "Resume session"}
              </Button>
              <Button variant="secondary" onClick={() => navigate("/compare")}>
                Compare sessions
              </Button>
            </div>
          </SurfaceCard>
        ) : (
          <SurfaceCard title="No saved session yet" eyebrow="Ready">
            <p className="mt-2 text-body text-muted">
              Create a vehicle in the garage, then start a session to unlock the full workflow.
            </p>
          </SurfaceCard>
        )}

        <SurfaceCard title="Local data controls" eyebrow="Device">
          <p className="mt-2 text-body text-muted">
            Guest data remains on this device until you explicitly connect an account and choose to sync it.
          </p>
          <div className="mt-4">
            <Button variant="text" onClick={() => void app.clearLocalData()}>
              Clear local guest data
            </Button>
          </div>
        </SurfaceCard>
      </div>
      <CornerDiagram
        assetId={supportingAssets.fourCornerOrientation.id}
        summary="The canonical car orientation remains fixed across onboarding, measurements, results, comparison, and reports."
      />
    </div>
  );
}
