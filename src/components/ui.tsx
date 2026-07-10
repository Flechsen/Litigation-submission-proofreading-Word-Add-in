import type { Lens, LensId } from '../types'
import { LENS_MAP } from '../data/lenses'

export const cx = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(' ')

/** The brand mark: a brass seal carrying a pilcrow (¶) — the proofreader's
 *  mark and Word's own paragraph glyph. The single memorable element. */
export function Seal({ size = 30 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
      className="grid shrink-0 select-none place-items-center rounded-[7px] bg-gradient-to-br from-brass-soft to-brass-deep font-serif font-semibold leading-none text-paper shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(21,32,43,0.25)]"
    >
      ¶
    </span>
  )
}

export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Seal size={size} />
      <div className="leading-tight">
        <div className="font-serif text-[15px] font-semibold tracking-tight text-ink">
          Schriftsatz<span className="text-brass">prüfung</span>
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
          Word-Add-in
        </div>
      </div>
    </div>
  )
}

export function LensBadge({
  lens,
  active = false,
  size = 22,
}: {
  lens: LensId | Lens
  active?: boolean
  size?: number
}) {
  const l = typeof lens === 'string' ? LENS_MAP[lens] : lens
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      title={l.name}
      className={cx(
        'grid shrink-0 place-items-center rounded-md border font-mono font-medium leading-none tabular-nums',
        active ? 'border-brass/30 bg-brass text-paper' : 'border-hairline bg-mist text-muted',
      )}
    >
      {l.monogram}
    </span>
  )
}
