import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, FileCheck2, RotateCcw } from 'lucide-react'
import type { ReviewApi } from '../../state/useReview'

function Footer({ api }: { api: ReviewApi }) {
  return (
    <div className="space-y-2 border-t border-hairline bg-white px-4 py-3">
      <button
        onClick={api.reset}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-muted transition hover:bg-mist hover:text-ink"
      >
        <RotateCcw size={13} /> Neue Prüfung
      </button>
    </div>
  )
}

export function Done({ api }: { api: ReviewApi }) {
  // --- write-back failed (Slice D) ---
  if (api.writeError) {
    return (
      <div className="flex h-full flex-col">
        <div className="scroll-thin flex-1 overflow-auto px-5 py-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
            className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-reject/10 text-reject"
          >
            <AlertCircle size={30} />
          </motion.div>
          <h2 className="mt-4 text-center font-serif text-[19px] font-semibold text-ink">
            Übernahme fehlgeschlagen
          </h2>
          <p className="mx-auto mt-1.5 max-w-[260px] text-center text-[12.5px] leading-relaxed text-muted">
            Die Änderungen konnten nicht in das Dokument geschrieben werden:
          </p>
          <div className="mt-4 rounded-xl border border-reject/30 bg-reject/5 p-3 text-[12px] text-reject">
            {api.writeError}
          </div>
        </div>
        <Footer api={api} />
      </div>
    )
  }

  const r = api.writeResult
  const bigNumber = r ? r.applied.length : api.counts.accepted
  const bigLabel = r
    ? 'Änderungen als nachverfolgte Word-Änderungen übernommen'
    : 'Vorschläge angenommen'

  const skipLines = r
    ? [
        { count: r.notFound.length, label: 'nicht gefunden — manuell prüfen' },
        { count: r.ambiguous.length, label: 'mehrdeutig — manuell prüfen' },
      ].filter((l) => l.count > 0)
    : []

  return (
    <div className="flex h-full flex-col">
      <div className="scroll-thin flex-1 overflow-auto px-5 py-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accept/12 text-accept"
        >
          <CheckCircle2 size={30} />
        </motion.div>
        <h2 className="mt-4 text-center font-serif text-[19px] font-semibold text-ink">
          Prüfung abgeschlossen
        </h2>

        <div className="mt-4 rounded-xl border border-accept/30 bg-accept/5 px-4 py-3 text-center">
          <span className="font-serif text-[26px] font-semibold tabular-nums text-accept">
            {bigNumber}
          </span>
          <p className="mt-0.5 text-[12px] leading-snug text-muted">{bigLabel}</p>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 text-[11.5px] text-muted">
          <span>{api.counts.accepted} angenommen</span>
          <span className="text-hairline">·</span>
          <span>{api.counts.rejected} verworfen</span>
          <span className="text-hairline">·</span>
          <span>{api.counts.total} gesamt</span>
        </div>

        {skipLines.length > 0 && (
          <div className="mt-3 rounded-xl border border-hairline bg-white p-3">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-faint">
              Übersprungen
            </p>
            <ul className="space-y-1">
              {skipLines.map(({ count, label }) => (
                <li key={label} className="flex items-center gap-2 text-[12px] text-muted">
                  <span className="font-mono text-[11px] text-ink">{count}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {r && (
          <div className="mt-4 rounded-xl border border-hairline bg-mist/50 p-3 text-[12px] text-muted">
            <div className="flex items-center gap-2 text-ink">
              <FileCheck2 size={15} className="text-brass" />
              <span className="font-medium">Nächste Schritte</span>
            </div>
            <ul className="mt-2 space-y-1.5">
              <li>· Änderungen in Word über „Überprüfen“ einzeln annehmen oder gesamt übernehmen.</li>
              <li>· Prüfbericht (Linse, Rn., Begründung) als Anlage zur Akte archivieren.</li>
            </ul>
          </div>
        )}
      </div>
      <Footer api={api} />
    </div>
  )
}
