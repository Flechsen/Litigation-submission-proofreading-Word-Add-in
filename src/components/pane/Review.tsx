import type { ReactNode } from 'react'
import { AlertTriangle, ArrowRight, Check, CheckCheck, Info, MapPin, RotateCcw, X } from 'lucide-react'
import { LENSES, LENS_MAP } from '../../data/lenses'
import { LensBadge, cx } from '../ui'
import { SuggestionCard } from './SuggestionCard'
import type { ReviewApi } from '../../state/useReview'
import type { Suggestion } from '../../types'

export function Review({ api }: { api: ReviewApi }) {
  const activeLenses = LENSES.filter((l) => api.enabled[l.id] && (api.finalCounts[l.id] || 0) > 0)
  const list = api.active.filter((s) => api.filter === 'all' || s.lens === api.filter)
  const pct =
    api.counts.total === 0 ? 0 : Math.round((api.counts.reviewed / api.counts.total) * 100)

  const placeable = list.filter((s) => (s.anchorStatus ?? 'unique') === 'unique')
  const manual = list.filter((s) => (s.anchorStatus ?? 'unique') !== 'unique')

  // Split placeable into conflict clusters and standalone findings. A finding
  // belongs to a cluster if it has a non-empty conflictsWith; the cluster key is
  // the sorted member-id tuple. Render each cluster once, anchored to the
  // smallest member id still visible under the current lens filter.
  const conflictClusters: Suggestion[][] = []
  const standalones: Suggestion[] = []

  for (const s of placeable) {
    const siblings = s.conflictsWith ?? []
    if (siblings.length === 0) {
      standalones.push(s)
      continue
    }
    const memberIds = [s.id, ...siblings].sort()
    const smallestVisible = memberIds.find((id) => placeable.some((p) => p.id === id))
    if (s.id !== smallestVisible) continue
    const members = memberIds
      .map((id) => api.suggestionsById.get(id))
      .filter((m): m is Suggestion => m !== undefined)
    conflictClusters.push(members)
  }

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="border-b border-hairline px-4 py-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-semibold text-ink">Vorschläge</span>
          <span className="font-mono text-[11px] text-muted">
            {api.counts.reviewed} / {api.counts.total} geprüft
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist">
          <div
            className="h-full rounded-full bg-brass transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-accept">
            <span className="h-2 w-2 rounded-full bg-accept" /> {api.counts.accepted} übernommen
          </span>
          <span className="flex items-center gap-1 text-muted">
            <span className="h-2 w-2 rounded-full bg-muted/50" /> {api.counts.rejected} verworfen
          </span>
          <span className="ml-auto text-faint">{api.counts.pending} offen</span>
        </div>

        {/* lens filter */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Chip active={api.filter === 'all'} onClick={() => api.setFilter('all')}>
            Alle {api.counts.total}
          </Chip>
          {activeLenses.map((l) => (
            <Chip key={l.id} active={api.filter === l.id} onClick={() => api.setFilter(l.id)}>
              {l.monogram} {api.finalCounts[l.id]}
            </Chip>
          ))}
        </div>
      </div>

      {/* list */}
      <div className="scroll-thin flex-1 overflow-auto px-4 py-3">
        <div className="space-y-2.5">
          {conflictClusters.map((members) => (
            <ConflictCard key={members.map((m) => m.id).sort().join('|')} members={members} api={api} />
          ))}
          {standalones.map((s) => (
            <SuggestionCard
              key={s.id}
              s={s}
              status={api.statusOf(s.id)}
              selected={api.selectedId === s.id}
              onSelect={() => api.setSelectedId(s.id)}
              onAccept={() => api.accept(s.id)}
              onReject={() => api.reject(s.id)}
              onReopen={() => api.reopen(s.id)}
            />
          ))}
          {placeable.length === 0 && manual.length === 0 && (
            <div className="py-8 text-center text-[12px] text-faint">
              Keine Vorschläge in dieser Linse.
            </div>
          )}
        </div>

        {manual.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1.5">
              <MapPin size={12} className="text-brass" />
              <span className="text-[11.5px] font-semibold text-ink">Zur manuellen Prüfung</span>
              <span className="ml-auto rounded-full bg-mist px-2 py-0.5 font-mono text-[10px] text-muted">
                {manual.length}
              </span>
            </div>
            <p className="mb-2.5 text-[11px] leading-relaxed text-faint">
              Diese Fundstellen lassen sich nicht eindeutig verorten — bitte direkt in Word prüfen.
            </p>
            <div className="space-y-2">
              {manual.map((s) => (
                <ManualCard
                  key={s.id}
                  s={s}
                  selected={api.selectedId === s.id}
                  onSelect={() => api.setSelectedId(s.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="space-y-2 border-t border-hairline bg-white px-4 py-3">
        {api.counts.pending > 0 && (
          <button
            onClick={api.acceptAll}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-hairline bg-white px-3 py-2 text-[12.5px] font-medium text-ink transition hover:border-brass/40 hover:bg-brass-wash/40"
          >
            <CheckCheck size={14} className="text-brass" /> Alle offenen übernehmen
          </button>
        )}
        <button
          onClick={api.finish}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper transition hover:bg-ink/90"
        >
          Prüfung abschließen
        </button>
      </div>
    </div>
  )
}

function ConflictCard({ members, api }: { members: Suggestion[]; api: ReviewApi }) {
  const rn = members[0]?.rn
  const anyAccepted = members.some((m) => api.statusOf(m.id) === 'accepted')
  const allRejected = members.every((m) => api.statusOf(m.id) === 'rejected')
  const resolved = anyAccepted || allRejected
  const isSelected = members.some((m) => api.selectedId === m.id)

  return (
    <div
      className={cx(
        'rounded-xl border bg-white shadow-card transition',
        isSelected ? 'border-brass/50 ring-2 ring-brass/25' : 'border-hairline hover:border-brass/30',
      )}
    >
      <div className="flex items-center gap-2 px-3 pt-3">
        <AlertTriangle size={14} className={resolved ? 'text-muted' : 'text-brass'} />
        <span className={cx('text-[12px] font-semibold', resolved ? 'text-muted' : 'text-ink/80')}>
          Konflikt — {members.length} Vorschläge
        </span>
        {rn != null && (
          <span className="ml-auto rounded-md bg-mist px-1.5 py-0.5 font-mono text-[10.5px] text-muted">
            Rn.&nbsp;{rn}
          </span>
        )}
      </div>

      {!resolved && (
        <div className="flex items-start gap-1.5 px-3 pb-1 pt-1.5 text-[11px] leading-snug text-faint">
          <Info size={11} className="mt-[2px] shrink-0" />
          <span>Mehrere Linsen ändern denselben Text unterschiedlich — bitte einen Vorschlag wählen.</span>
        </div>
      )}

      <div className="divide-y divide-hairline px-3 pt-1">
        {members.map((m) => {
          const st = api.statusOf(m.id)
          const mSelected = api.selectedId === m.id
          const lens = LENS_MAP[m.lens]
          const isAccepted = st === 'accepted'
          const isRejected = st === 'rejected'

          return (
            <div
              key={m.id}
              onClick={() => api.setSelectedId(m.id)}
              className={cx(
                'cursor-pointer py-2.5 transition',
                isAccepted && 'opacity-100',
                isRejected && !anyAccepted && 'opacity-60',
              )}
            >
              <div className="mb-1.5 flex items-center gap-2">
                {isAccepted && (
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accept/12 text-accept">
                    <Check size={13} />
                  </span>
                )}
                {isRejected && (
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted/15 text-muted">
                    <X size={13} />
                  </span>
                )}
                {st === 'pending' && (
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-hairline bg-white" />
                )}
                <LensBadge lens={lens} active={mSelected} />
                <span
                  className={cx(
                    'text-[11.5px] font-medium',
                    isAccepted ? 'text-accept' : isRejected ? 'text-muted' : 'text-ink/80',
                  )}
                >
                  {lens.name}
                </span>
              </div>

              <div className={cx('rounded-lg p-2', isAccepted ? 'bg-accept/8' : 'bg-mist/50')}>
                <div
                  className={cx(
                    'text-[12px] leading-snug',
                    isRejected ? 'text-muted/60 line-through decoration-muted/30' : 'text-muted',
                  )}
                >
                  {m.original}
                </div>
                <div className="mt-0.5 flex items-start gap-1">
                  <ArrowRight size={12} className="mt-[3px] shrink-0 text-brass" />
                  <span
                    className={cx(
                      'text-[12.5px] font-medium leading-snug',
                      isRejected ? 'text-muted/60 line-through decoration-muted/30' : 'text-ink',
                    )}
                  >
                    {m.suggestion}
                  </span>
                </div>
              </div>

              <div className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug text-faint">
                <Info size={11} className="mt-[2px] shrink-0" />
                <span>{m.rationale}</span>
              </div>

              {st === 'pending' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    api.accept(m.id)
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accept px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-accept/90"
                >
                  <Check size={13} /> Diesen übernehmen
                </button>
              )}
              {isAccepted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    api.reopen(m.id)
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-hairline bg-white px-3 py-1.5 text-[12px] font-medium text-muted transition hover:bg-mist hover:text-ink"
                >
                  <RotateCcw size={12} /> Zurück
                </button>
              )}
            </div>
          )
        })}
      </div>

      {!allRejected && (
        <div className="border-t border-hairline px-3 py-2">
          <button
            onClick={() => {
              for (const m of members) {
                if (api.statusOf(m.id) !== 'rejected') api.reject(m.id)
              }
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-hairline bg-white px-3 py-1.5 text-[12px] font-medium text-muted transition hover:border-reject/40 hover:bg-reject/5 hover:text-reject"
          >
            <X size={13} /> Alle verwerfen
          </button>
        </div>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-full border px-2.5 py-1 font-mono text-[11px] transition',
        active
          ? 'border-brass bg-brass text-white'
          : 'border-hairline bg-white text-muted hover:border-brass/40 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

function ManualCard({ s, selected, onSelect }: { s: Suggestion; selected: boolean; onSelect: () => void }) {
  const lens = LENS_MAP[s.lens]
  return (
    <div
      onClick={onSelect}
      className={cx(
        'cursor-pointer rounded-xl border bg-white p-3 shadow-card transition',
        selected ? 'border-brass/50 ring-2 ring-brass/25' : 'border-hairline hover:border-brass/30',
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <LensBadge lens={lens} />
        <span className="text-[12px] font-medium text-ink/80">{lens.name}</span>
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
    </div>
  )
}
