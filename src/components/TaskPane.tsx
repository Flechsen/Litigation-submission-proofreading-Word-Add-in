import { AnimatePresence, motion } from 'framer-motion'
import { Idle } from './pane/Idle'
import { Scanning } from './pane/Scanning'
import { Review } from './pane/Review'
import { Done } from './pane/Done'
import type { ReviewApi } from '../state/useReview'

export function TaskPane({ api }: { api: ReviewApi }) {
  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* pane title strip — Word provides the surrounding chrome */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 border-b border-hairline bg-[url('/assets/albert1.jpg')] bg-cover bg-center px-3 py-2.5">
        {/* logo + title sit on a translucent plate — the photo is dark, so the
            dark-ink wordmark and text need a light backing to stay legible */}
        <div className="flex flex-col items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
          <img src="/assets/logo-bdpe.png" alt="BDPE" className="h-7 w-auto" />
          <span className="font-serif text-[13px] font-semibold text-ink">Schriftsatzprüfung</span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={api.phase}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
          >
            {api.phase === 'idle' && <Idle api={api} />}
            {api.phase === 'scanning' && <Scanning api={api} />}
            {api.phase === 'review' && <Review api={api} />}
            {api.phase === 'done' && <Done api={api} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
