import type { Suggestion } from '../types'

/** Response shape of `POST /api/run` (engine.serve_addin). */
export interface RunResult {
  meta: { paragraphCount: number; provider: string; lenses?: string[] }
  findings: Suggestion[]
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string })
    throw new Error(body.error ?? `Anfrage fehlgeschlagen: ${res.status}`)
  }
  return res.json() as Promise<T>
}

/**
 * Send the open document's paragraphs to the local engine bridge and get the
 * merged findings back. Proxied same-origin (`/api` → localhost:8000 via Vite).
 *
 * `lenses` is the set of lens ids to actually run (the ones enabled in the pane).
 * The engine runs only those — a lens toggled off is never called, so it costs
 * no time or tokens (not merely hidden from the result).
 */
export async function runReview(
  paragraphs: string[],
  lenses: string[],
  provider?: string,
): Promise<Suggestion[]> {
  const body = await json<RunResult>(
    await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paragraphs, lenses, provider }),
    }),
  )
  return body.findings
}
