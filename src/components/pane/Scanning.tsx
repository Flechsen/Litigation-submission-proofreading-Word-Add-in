import { Loader2 } from 'lucide-react'
import type { ReviewApi } from '../../state/useReview'

export function Scanning(_: { api: ReviewApi }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
      <Loader2 size={32} className="animate-spin text-brass" />
      <p className="text-center text-[13px] font-medium text-ink">Der Schriftsatz wird geprüft …</p>
      <p className="text-center text-[11.5px] leading-relaxed text-muted">
        Die aktiven Linsen analysieren den geöffneten Text parallel.
      </p>
    </div>
  )
}
