import type { Lens } from '../types'

/** The six validation lenses from the planning notes. Each lens = one focused
 *  pass over the text; they run in parallel. Zitatprüfung is deferred because
 *  it needs the cited sources (NK1/NK5/NK6/WB) as an additional input. */
export const LENSES: Lens[] = [
  { id: 'orthografie', name: 'Orthografie', monogram: 'Or', desc: 'Rechtschreibung, Groß-/Kleinschreibung, ß/ss' },
  { id: 'interpunktion', name: 'Interpunktion', monogram: 'In', desc: 'Kommaregeln, Anführungszeichen, Striche' },
  { id: 'grammatik', name: 'Grammatik & Satzbau', monogram: 'Gr', desc: 'Kongruenz, Kasus, Wortstellung' },
  { id: 'konsistenz', name: 'Konsistenz', monogram: 'Ko', desc: 'Begriffe, Partei- & Anlagenkürzel, Rn.-Verweise; Vertauschung von NK-Nummern' },
  { id: 'zitierformat', name: 'Zitierformat', monogram: 'Zf', desc: 'Hauszitierweise, Fundstelle vor dem Zitat' },
  {
    id: 'zitatpruefung',
    name: 'Zitatprüfung',
    monogram: 'Zp',
    desc: 'Zitate gegen die Quelle (NK1, NK5, NK6, WB)',
    deferred: true,
  },
]

export const LENS_MAP: Record<string, Lens> = Object.fromEntries(
  LENSES.map((l) => [l.id, l]),
)
