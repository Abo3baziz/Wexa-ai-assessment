import type { PatientStats } from "@/types";

interface StatDef {
  label: string;
  value: number;
  dot: string;
}

export function StatCards({ stats }: { stats: PatientStats }) {
  const items: StatDef[] = [
    { label: "Diseases", value: stats.diseases, dot: "bg-node-disease" },
    { label: "Visits", value: stats.visits, dot: "bg-node-visit" },
    { label: "Medications", value: stats.medications, dot: "bg-node-medication" },
    { label: "Doctors", value: stats.doctors, dot: "bg-node-doctor" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <dt className="flex items-center gap-2 text-xs text-ink-muted">
            <span
              className={`h-2 w-2 rounded-full ${item.dot}`}
              aria-hidden="true"
            />
            {item.label}
          </dt>
          <dd className="mt-2 text-2xl font-semibold tabular-nums text-ink">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
