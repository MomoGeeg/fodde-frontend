/**
 * Composants squelettes de chargement réutilisables
 * Utilisés dans tous les modules pendant le fetch Supabase.
 */

// ── Table squelette ────────────────────────────────────────
export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 border-b border-gray-100 bg-gray-50 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 flex-1 rounded bg-gray-200" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-gray-50 px-4 py-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-3 flex-1 rounded bg-gray-100"
              style={{ maxWidth: c === 0 ? "40%" : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Carte KPI squelette ────────────────────────────────────
export function SkeletonCard({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-12 rounded bg-gray-200" />
              <div className="h-2.5 w-20 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Formulaire squelette ───────────────────────────────────
export function SkeletonForm({ fields = 6 }) {
  return (
    <div className="animate-pulse space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-10 w-full rounded-xl bg-gray-100" />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <div className="h-10 w-32 rounded-xl bg-gray-200" />
        <div className="h-10 w-24 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

// ── Graphique squelette ────────────────────────────────────
export function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 h-4 w-40 rounded bg-gray-200" />
      <div className="flex items-end gap-2" style={{ height: 200 }}>
        {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gray-100"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Ligne simple squelette ─────────────────────────────────
export function SkeletonLine({ width = "100%", height = 12 }) {
  return (
    <div
      className="animate-pulse rounded bg-gray-200"
      style={{ width, height }}
    />
  );
}
