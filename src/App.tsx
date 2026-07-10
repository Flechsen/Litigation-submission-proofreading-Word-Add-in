import { useEffect, useState } from 'react'
import { TaskPane } from './components/TaskPane'
import { useReview } from './state/useReview'

/** Mounts the review workflow. Kept as a child so its hook (and the Office.js
 *  reads inside it) only run once the host is ready. */
function ReviewRoot() {
  const api = useReview()
  return <TaskPane api={api} />
}

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Wait for the Office host before touching Word APIs. In a plain browser
    // (dev) there is no host, so render anyway.
    if (typeof Office !== 'undefined' && Office.onReady) {
      Office.onReady(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [])

  if (!ready) {
    return (
      <div className="grid h-full place-items-center bg-paper text-[13px] text-muted">
        Wird geladen …
      </div>
    )
  }

  return <ReviewRoot />
}
