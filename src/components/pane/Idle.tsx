import { AlertCircle, FileText, Layers, Lock, Play } from 'lucide-react'
import { LENSES } from '../../data/lenses'
import { LensBadge, cx } from '../ui'
import type { ReviewApi } from '../../state/useReview'

export function Idle({ api }: { api: ReviewApi }) {
  const activeCount = LENSES.filter((l) => api.enabled[l.id]).length

  return (
    <div className="flex h-full flex-col">
      <div className="scroll-thin flex-1 overflow-auto px-4 py-4">
        {/* document card */}
        <div className="flex items-start gap-2.5 rounded-xl border border-hairline bg-mist/50 p-3">
          <FileText size={18} className="mt-0.5 shrink-0 text-brass" />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-ink">
              {api.fileName || 'Aktuelles Word-Dokument'}
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted">Geöffnetes Dokument</div>
          </div>
        </div>

        {api.loadError && (
          <div className="mt-3 rounded-xl border border-reject/30 bg-reject/5 p-3">
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-reject">
              <AlertCircle size={14} className="shrink-0" />
              Prüfung nicht möglich
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-reject/80">{api.loadError}</p>
            <p className="mt-1.5 text-[11px] leading-snug text-reject/60">
              Läuft der Analysedienst? <code className="font-mono">python -m engine.serve_addin</code>
            </p>
          </div>
        )}

        <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
          Wort-für-Wort-Prüfung des geöffneten Schriftsatzes. Jede Linse prüft einen Aspekt — die
          aktiven Linsen laufen <span className="font-medium text-ink">parallel</span> und liefern
          eine Liste aus Vorschlägen zum Annehmen oder Verwerfen.
        </p>

        {/* lenses */}
        <div className="mb-1.5 mt-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
          <Layers size={12} /> Prüflinsen
        </div>
        <div className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
          {LENSES.map((l) => {
            const on = api.enabled[l.id]
            return (
              <button
                key={l.id}
                disabled={l.deferred}
                onClick={() => api.toggleLens(l.id)}
                className={cx(
                  'flex w-full items-center gap-2.5 px-2.5 py-2.5 text-left transition',
                  l.deferred ? 'cursor-not-allowed opacity-60' : 'hover:bg-mist/60',
                )}
              >
                <LensBadge lens={l} active={on} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
                    {l.name}
                    {l.deferred && (
                      <span className="flex items-center gap-1 rounded bg-mist px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-faint">
                        <Lock size={9} /> später
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[11px] text-muted">{l.desc}</div>
                </div>
                <span
                  className={cx(
                    'relative h-[18px] w-8 shrink-0 rounded-full transition',
                    on ? 'bg-brass' : 'bg-hairline',
                  )}
                >
                  <span
                    className={cx(
                      'absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-all',
                      on ? 'left-[16px]' : 'left-[2px]',
                    )}
                  />
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 px-1 text-[11px] leading-snug text-faint">
          Die Zitatprüfung benötigt die zitierten Quellen (NK1, NK5, NK6, WB) als zusätzliche
          Eingabe — vorgesehen für eine spätere Ausbaustufe.
        </p>
      </div>

      <div className="border-t border-hairline bg-white px-4 py-3">
        <button
          onClick={api.start}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brass px-4 py-3 text-[14px] font-semibold text-white shadow-sm transition hover:bg-brass-deep"
        >
          <Play size={16} /> Prüfung starten
        </button>
        <div className="mt-2 text-center text-[11px] text-faint">{activeCount} Linsen aktiv</div>
      </div>
    </div>
  )
}
