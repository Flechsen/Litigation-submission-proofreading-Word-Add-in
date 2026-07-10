import { useEffect, useState } from 'react'
import { Wordmark } from './components/ui'

/**
 * Slice B placeholder shell. Its only job is to prove the add-in loads inside
 * Word and Office.js is reachable. The review workflow (idle → scanning →
 * review → done) arrives in Slice C, when the pane is wired to the live document
 * and the local analysis bridge.
 */
export default function App() {
  const [host, setHost] = useState<string>('…')

  useEffect(() => {
    // Office.onReady resolves once the host application is available. Guard the
    // plain-browser case (no Office host) so `npm run dev` opened in a normal
    // browser tab doesn't throw.
    if (typeof Office !== 'undefined' && Office.onReady) {
      Office.onReady((info) => setHost(info.host ? String(info.host) : 'Browser'))
    } else {
      setHost('Browser')
    }
  }, [])

  return (
    <div className="flex h-full flex-col bg-paper">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <Wordmark />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="font-serif text-lg font-semibold text-ink">Bereit.</div>
        <p className="max-w-[15rem] text-sm leading-relaxed text-muted">
          Das Add-in ist geladen. Die Schriftsatzprüfung folgt im nächsten Schritt.
        </p>
        <span className="mt-1 rounded-full border border-hairline bg-mist px-2.5 py-1 font-mono text-[11px] text-faint">
          Host: {host}
        </span>
      </main>
    </div>
  )
}
