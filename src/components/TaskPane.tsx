import { AnimatePresence, motion } from 'framer-motion'
import { Seal } from './ui'
import { Idle } from './pane/Idle'
import { Scanning } from './pane/Scanning'
import { Review } from './pane/Review'
import { Done } from './pane/Done'
import type { ReviewApi } from '../state/useReview'

export function TaskPane({ api }: { api: ReviewApi }) {
  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* pane title strip — Word provides the surrounding chrome */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-hairline bg-[#faf9f8] px-3">
        <Seal size={20} />
        <span className="font-serif text-[13px] font-semibold text-ink">Schriftsatzprüfung</span>
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
