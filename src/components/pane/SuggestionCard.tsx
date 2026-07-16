import { ArrowRight, Check, Info, RotateCcw, X } from 'lucide-react'
import type { Status, Suggestion } from '../../types'
import { LENS_MAP } from '../../data/lenses'
import { LensBadge, cx } from '../ui'

export function SuggestionCard({
  s,
  status,
  selected,
  onSelect,
  onAccept,
  onReject,
  onReopen,
}: {
  s: Suggestion
  status: Status
  selected: boolean
  onSelect: () => void
  onAccept: () => void
  onReject: () => void
  onReopen: () => void
}) {
  const lens = LENS_MAP[s.lens]

  // resolved findings collapse to a compact row with an undo affordance
  if (status !== 'pending') {
    const accepted = status === 'accepted'
    return (
      <div
        onClick={onSelect}
        className={cx(
          'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-[12px] transition',
          selected ? 'border-brass/40 bg-brass-wash/50' : 'border-hairline bg-mist/40 hover:bg-mist',
        )}
      >
        <span
          className={cx(
            'grid h-5 w-5 shrink-0 place-items-center rounded-full',
            accepted ? 'bg-accept/12 text-accept' : 'bg-muted/15 text-muted',
          )}
        >
          {accepted ? <Check size={13} /> : <X size={13} />}
        </span>
        {s.rn != null && (
          <span className="shrink-0 font-mono text-[10.5px] text-faint">Rn.&nbsp;{s.rn}</span>
        )}
        <span
          className={cx(
            'min-w-0 flex-1 truncate',
            accepted ? 'text-ink' : 'text-muted line-through decoration-muted/40',
          )}
        >
          {accepted ? s.suggestion : s.original}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onReopen()
          }}
          className="flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted transition hover:bg-white hover:text-ink"
        >
          <RotateCcw size={12} /> Zurück
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={onSelect}
      className={cx(
        'cursor-pointer rounded-xl border bg-white p-3 shadow-card transition',
        selected ? 'border-brass/50 ring-2 ring-brass/25' : 'border-hairline hover:border-brass/30',
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <LensBadge lens={lens} variant="full" />
        {s.rn != null && (
          <span className="ml-auto rounded-md bg-mist px-1.5 py-0.5 font-mono text-[10.5px] text-muted">
            Rn.&nbsp;{s.rn}
          </span>
        )}
      </div>

      <div className="rounded-lg bg-mist/60 p-2.5">
        <div className="text-[12.5px] leading-snug text-muted">
          <span className="line-through decoration-muted/40">{s.original}</span>
        </div>
        <div className="mt-1 flex items-start gap-1.5">
          <ArrowRight size={14} className="mt-[3px] shrink-0 text-brass" />
          <span className="text-[13.5px] font-medium leading-snug text-ink">{s.suggestion}</span>
        </div>
      </div>

      <div className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-snug text-muted">
        <Info size={12} className="mt-[2px] shrink-0 text-faint" />
        <span>{s.rationale}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAccept()
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accept px-3 py-1.5 text-[12.5px] font-medium text-white transition hover:bg-accept/90"
        >
          <Check size={14} /> Übernehmen
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onReject()
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-hairline bg-white px-3 py-1.5 text-[12.5px] font-medium text-muted transition hover:border-reject/40 hover:bg-reject/5 hover:text-reject"
        >
          <X size={14} /> Verwerfen
        </button>
      </div>
    </div>
  )
}
