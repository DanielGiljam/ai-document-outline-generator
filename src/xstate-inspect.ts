import { InspectionEvent, Observer } from 'xstate'

export let inspect: Observer<InspectionEvent> | undefined

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  let inspector: { inspect: Observer<InspectionEvent> } | undefined
  const deferredEvents: Array<
    [
      keyof Observer<InspectionEvent>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
    ]
  > = []
  inspect = {
    next: (value) => {
      if (inspector == null) {
        deferredEvents.push(['next', value])
      } else {
        inspector.inspect.next?.(value)
      }
    },
    error: (err) => {
      if (inspector == null) {
        deferredEvents.push(['error', err])
      } else {
        inspector.inspect.error?.(err)
      }
    },
    complete: () => {
      if (inspector == null) {
        deferredEvents.push(['complete', undefined])
      } else {
        inspector.inspect.complete?.()
      }
    },
  }
  import('@statelyai/inspect').then(({ createBrowserInspector }) => {
    inspector = createBrowserInspector()
    for (const [event, value] of deferredEvents) {
      inspector.inspect[event]?.(value)
    }
  })
}
