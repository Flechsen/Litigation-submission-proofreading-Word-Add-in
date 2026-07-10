/**
 * Office.js glue — the only module that talks to Word.
 *
 * Slice C uses just the read side: pull the open document's paragraph text so the
 * engine can analyze it. Navigation (select a finding's span) and the
 * tracked-changes write-back land in Slice D and will live here too.
 */

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
