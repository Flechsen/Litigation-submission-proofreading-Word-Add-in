export type LensId =
  | 'orthografie'
  | 'interpunktion'
  | 'grammatik'
  | 'konsistenz'
  | 'zitierformat'
  | 'zitatpruefung'

export interface Lens {
  id: LensId
  name: string
  /** two-letter monogram shown in the badge */
  monogram: string
  desc: string
  /** deferred lenses are shown but cannot be enabled yet (need extra input) */
  deferred?: boolean
}

export type AnchorStatus = 'unique' | 'ambiguous' | 'none'

/** Where a finding's `original` span sits — per-paragraph char offsets, as the
 *  engine's merge computes them. Used by the Slice D write-back. */
export interface Anchor {
  paraIndex: number
  charStart: number
  charEnd: number
}

/** A finding as returned by the engine (`Finding`, camelCase). Superset of what
 *  the cards need; the extra fields feed navigation and the write-back. */
export interface Suggestion {
  id: string
  /** Randnummer the finding sits in (null for unnumbered paragraphs/headings) */
  rn: number | null
  lens: LensId
  /** all contributing lenses (length > 1 only on a composed finding) */
  lenses?: LensId[]
  /** the exact span as it currently reads in the document */
  original: string
  /** the proposed replacement */
  suggestion: string
  /** one-line reason, in the interface's voice */
  rationale: string
  /** located span, or null when not anchorable */
  anchor?: Anchor | null
  /** did the model quote `original` faithfully (real substring)? */
  quotedVerbatim?: boolean
  /** placement of `original` in the source; only 'unique' is auto-applied */
  anchorStatus?: AnchorStatus
  /** ids of the other findings that conflict with this one (overlapping edits) */
  conflictsWith?: string[]
  passNo?: number
}

export type Status = 'pending' | 'accepted' | 'rejected'
export type Phase = 'idle' | 'scanning' | 'review' | 'done'
