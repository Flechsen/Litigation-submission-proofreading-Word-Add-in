import type { Suggestion } from '../types'

/** Response shape of `POST /api/run` (engine.serve_addin). */
export interface RunResult {
  meta: { paragraphCount: number; provider: string }
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
 */
export async function runReview(paragraphs: string[], provider?: string): Promise<Suggestion[]> {
  const body = await json<RunResult>(
    await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paragraphs, provider }),
    }),
  )
  return body.findings
}
