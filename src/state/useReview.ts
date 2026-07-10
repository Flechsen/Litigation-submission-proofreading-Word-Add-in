import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LensId, Phase, Status, Suggestion } from '../types'
import { LENSES } from '../data/lenses'
import { runReview } from '../data/api'
import { getFileName, readParagraphs } from '../office/word'

const DEFAULT_ENABLED: Record<LensId, boolean> = {
  orthografie: true,
  interpunktion: true,
  grammatik: true,
  konsistenz: true,
  zitierformat: true,
  zitatpruefung: false, // deferred — needs the cited sources as input
}

export type Filter = LensId | 'all'

/** Outcome of the Office.js write-back (populated in Slice D). */
export interface WriteResult {
  applied: string[]
  notFound: string[]
  ambiguous: string[]
}

export function useReview() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [enabled, setEnabled] = useState<Record<LensId, boolean>>(DEFAULT_ENABLED)
  const [status, setStatus] = useState<Record<string, Status>>({})
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [writeResult, setWriteResult] = useState<WriteResult | null>(null)
  const [writeError, setWriteError] = useState<string | null>(null)

  // Best-effort document name for the idle card (refreshed on each run).
  useEffect(() => {
    setFileName(getFileName())
  }, [])

  // suggestions in scope (enabled lenses), sorted by Randnummer then doc order
  const active = useMemo(() => {
    const order = new Map(suggestions.map((s, i) => [s.id, i]))
    return suggestions
      .filter((s) => enabled[s.lens])
      .sort(
        (a, b) =>
          (a.rn ?? Number.MAX_SAFE_INTEGER) - (b.rn ?? Number.MAX_SAFE_INTEGER) ||
          order.get(a.id)! - order.get(b.id)!,
      )
  }, [enabled, suggestions])

  const finalCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const l of LENSES) c[l.id] = 0
    for (const s of active) c[s.lens] += 1
    return c
  }, [active])

  const statusOf = useCallback((id: string): Status => status[id] ?? 'pending', [status])

  // --- run the engine over the live document ---
  const run = useCallback(async () => {
    setPhase('scanning')
    setLoadError(null)
    setWriteResult(null)
    setWriteError(null)
    setStatus({})
    setSelectedId(null)
    try {
      const paragraphs = await readParagraphs()
      setFileName(getFileName())
      const findings = await runReview(paragraphs)
      setSuggestions(findings)
      setPhase('review')
    } catch (e) {
      setLoadError(String(e instanceof Error ? e.message : e))
      setPhase('idle')
    }
  }, [])

  // --- actions ---
  const toggleLens = useCallback((id: LensId) => {
    setEnabled((e) => ({ ...e, [id]: !e[id] }))
  }, [])

  const start = run

  const selectNextPending = useCallback(
    (fromId: string) => {
      const list = active
      const idx = list.findIndex((s) => s.id === fromId)
      for (let i = idx + 1; i < list.length; i++) {
        if ((status[list[i].id] ?? 'pending') === 'pending') return list[i].id
      }
      for (let i = 0; i < idx; i++) {
        if ((status[list[i].id] ?? 'pending') === 'pending') return list[i].id
      }
      return null
    },
    [active, status],
  )

  const suggestionsById = useMemo(
    () => new Map<string, Suggestion>(suggestions.map((s) => [s.id, s])),
    [suggestions],
  )

  const decide = useCallback(
    (id: string, decision: Status) => {
      setStatus((s) => ({ ...s, [id]: decision }))
      setSelectedId(selectNextPending(id))
    },
    [selectNextPending],
  )

  const accept = useCallback(
    (id: string) => {
      const found = suggestionsById.get(id)
      const siblings = found?.conflictsWith ?? []
      if (siblings.length > 0) {
        // Accept the chosen finding and auto-reject its cluster siblings in one update.
        setStatus((s) => {
          const n = { ...s, [id]: 'accepted' as Status }
          for (const sibId of siblings) n[sibId] = 'rejected'
          return n
        })
        setSelectedId(selectNextPending(id))
      } else {
        decide(id, 'accepted')
      }
    },
    [decide, selectNextPending, suggestionsById],
  )
  const reject = useCallback((id: string) => decide(id, 'rejected'), [decide])

  const reopen = useCallback((id: string) => {
    setStatus((s) => {
      const n = { ...s }
      delete n[id]
      return n
    })
    setSelectedId(id)
  }, [])

  const acceptAll = useCallback(() => {
    setStatus((s) => {
      const n = { ...s }
      const autoRejected = new Set<string>()
      for (const x of active) {
        if ((n[x.id] ?? 'pending') !== 'pending') continue
        if (autoRejected.has(x.id)) continue
        n[x.id] = 'accepted'
        for (const sibId of suggestionsById.get(x.id)?.conflictsWith ?? []) {
          n[sibId] = 'rejected'
          autoRejected.add(sibId)
        }
      }
      return n
    })
  }, [active, suggestionsById])

  const finish = useCallback(() => {
    // Slice C: tally the decisions and show the summary. Slice D wires the
    // Office.js tracked-change write-back here (populating writeResult).
    setPhase('done')
  }, [])

  const reset = useCallback(() => {
    setStatus({})
    setSelectedId(null)
    setFilter('all')
    setSuggestions([])
    setWriteResult(null)
    setWriteError(null)
    setPhase('idle')
  }, [])

  // --- counts ---
  const counts = useMemo(() => {
    let accepted = 0
    let rejected = 0
    for (const s of active) {
      const st = status[s.id] ?? 'pending'
      if (st === 'accepted') accepted++
      else if (st === 'rejected') rejected++
    }
    const total = active.length
    const reviewed = accepted + rejected
    return { total, accepted, rejected, reviewed, pending: total - reviewed }
  }, [active, status])

  return {
    phase,
    enabled,
    toggleLens,
    suggestions,
    suggestionsById,
    active,
    finalCounts,
    statusOf,
    filter,
    setFilter,
    selectedId,
    setSelectedId,
    start,
    accept,
    reject,
    reopen,
    acceptAll,
    finish,
    reset,
    counts,
    fileName,
    loadError,
    writeResult,
    writeError,
  }
}

export type ReviewApi = ReturnType<typeof useReview>
