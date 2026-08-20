import type { PatientOverview } from "@/types";
import { StatCards } from "./StatCards";

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PatientOverview({
  overview,
  onExploreGraph,
}: {
  overview: PatientOverview;
  onExploreGraph: () => void;
}) {
  const { patient, stats, health } = overview;

  return (
    <section className="animate-fade-in" aria-label="Patient overview">
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              {patient.firstName} {patient.lastName}
            </h2>
            <span className="font-mono text-sm text-ink-muted">
              {patient.publicId}
            </span>
            <span className="font-mono text-xs text-ink-muted">
              NID {patient.nationalId}
            </span>
          </div>
          <button
            type="button"
            onClick={onExploreGraph}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-card transition-colors hover:bg-brand/90"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19" />
            </svg>
            Explore Graph
          </button>
        </div>
        <dl className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Date of birth</dt>
            <dd>{formatDate(patient.dateOfBirth)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Gender</dt>
            <dd className="capitalize">{patient.gender}</dd>
          </div>
        </dl>
      </header>

      <StatCards stats={stats} />

      {(health.currentDiseases.length > 0 ||
        health.currentMedications.length > 0) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {health.currentDiseases.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-xs font-medium text-ink-muted">
                Current conditions
              </h3>
              <ul className="mt-2 space-y-1.5">
                {health.currentDiseases.map((cd) => (
                  <li key={cd.disease.id} className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full bg-node-disease"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-ink">
                      {cd.disease.name}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {cd.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {health.currentMedications.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-xs font-medium text-ink-muted">
                Current medications
              </h3>
              <ul className="mt-2 space-y-1.5">
                {health.currentMedications.map((cm) => (
                  <li key={cm.medication.id} className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full bg-node-medication"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-ink">
                      {cm.medication.name}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {cm.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
