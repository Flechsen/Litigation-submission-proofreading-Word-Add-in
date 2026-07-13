/**
 * Office.js glue — the only module that talks to Word.
 *
 * Read side (Slice C): pull the open document's paragraph text for analysis.
 * Write side (Slice D): navigate to a finding, and apply accepted findings as
 * native tracked changes.
 *
 * Locating a span: we search the **whole document** for the finding's verbatim
 * `original`. The engine marks a finding `unique` only when `original` occurs
 * exactly once, so a whole-document search returns exactly one range — no
 * paragraph-index bookkeeping, and no risk of the empty-paragraph index drift
 * between Word's `body.paragraphs` and the engine's normalized paragraph list.
 * `ignoreSpace` absorbs the engine's collapsed-whitespace normalization vs. the
 * raw document. Anything that isn't a single clean match is reported, never
 * guessed.
 */

/** Word's search matches up to ~255 characters; longer spans can't be located. */
const MAX_SEARCH = 255

/** Tolerate whitespace differences (engine normalizes runs of space to one). */
const SEARCH_OPTS = { matchCase: true, ignoreSpace: true }

export interface WriteReport {
  applied: string[]
  notFound: string[]
  ambiguous: string[]
}

/** Read every paragraph's text from the open document, in document order. */
export async function readParagraphs(): Promise<string[]> {
  return Word.run(async (context) => {
    const paras = context.document.body.paragraphs
    paras.load('items/text')
    await context.sync()
    return paras.items.map((p) => p.text)
  })
}

/** Best-effort file name of the open document (empty-safe, never throws). */
export function getFileName(): string {
  try {
    const url = (Office.context?.document as unknown as { url?: string } | undefined)?.url
    if (url) return url.split(/[\\/]/).pop() || url
  } catch {
    /* no host / not available — fall through to the generic label */
  }
  return 'Aktuelles Word-Dokument'
}

/** Scroll Word to a finding's span (best-effort — a unique span selects cleanly).
 *
 * Tries the verbatim (case-sensitive) match first, then a case-insensitive
 * retry so a lead-capitalization difference still navigates. NOTE: neither
 * absorbs a non-breaking-space mismatch — the engine normalizes NBSP/narrow-NBSP
 * to a plain space, and Word's `ignoreSpace` does not treat NBSP as space, so an
 * `original` spanning an NBSP (common in German legal text: `§ 823`, `S. 185`)
 * finds nothing here. That deeper anchoring fix is tracked as its own issue. */
export async function selectFinding(original: string): Promise<void> {
  if (!original || original.length > MAX_SEARCH) return
  await Word.run(async (context) => {
    const find = async (matchCase: boolean) => {
      const r = context.document.body.search(original, { matchCase, ignoreSpace: true })
      r.load('items')
      await context.sync()
      return r.items
    }
    let items = await find(true)
    if (items.length === 0) items = await find(false)
    if (items.length > 0) {
      items[0].select()
      await context.sync()
    }
  })
}

/**
 * Apply accepted findings as native tracked changes and return a coverage
 * report. Track Changes is enabled for the duration and the document's prior
 * tracking mode is restored afterward; already-inserted revisions stay tracked.
 * A finding that is too long, unmatched, or matches more than once is reported
 * (notFound / ambiguous), never applied.
 */
export async function applyFindings(
  findings: { id: string; original: string; suggestion: string }[],
): Promise<WriteReport> {
  const report: WriteReport = { applied: [], notFound: [], ambiguous: [] }
  await Word.run(async (context) => {
    const doc = context.document
    doc.load('changeTrackingMode')
    await context.sync()

    const prior = doc.changeTrackingMode
    doc.changeTrackingMode = Word.ChangeTrackingMode.trackAll
    await context.sync()

    for (const f of findings) {
      if (!f.original || f.original.length > MAX_SEARCH) {
        report.notFound.push(f.id)
        continue
      }
      const results = doc.body.search(f.original, SEARCH_OPTS)
      results.load('items')
      await context.sync()

      const n = results.items.length
      if (n === 0) {
        report.notFound.push(f.id)
      } else if (n > 1) {
        report.ambiguous.push(f.id)
      } else {
        results.items[0].insertText(f.suggestion, Word.InsertLocation.replace)
        report.applied.push(f.id)
        await context.sync()
      }
    }

    doc.changeTrackingMode = prior
    await context.sync()
  })
  return report
}
