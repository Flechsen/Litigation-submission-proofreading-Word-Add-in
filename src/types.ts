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

export interface Suggestion {
  id: string
  /** Randnummer the finding sits in */
  rn: number
  lens: LensId
  /** the exact span as it currently reads in the document */
  original: string
  /** the proposed replacement */
  suggestion: string
  /** one-line reason, in the interface's voice */
  rationale: string
  /** placement of `original` in the source; only 'unique' is inlined in the doc */
  anchorStatus?: AnchorStatus
  /** ids of the other findings that conflict with this one (overlapping edits) */
  conflictsWith?: string[]
}

export type Status = 'pending' | 'accepted' | 'rejected'
export type Phase = 'idle' | 'scanning' | 'review' | 'done'
