'use client'

import { Banner, Button, TextInput } from '@payloadcms/ui'
import { createActorContext } from '@xstate/react'
import { CornerDownLeft } from 'lucide-react'
import React from 'react'
import { InspectionEvent, Observer, assign, fromPromise, setup } from 'xstate'

let inspect: Observer<InspectionEvent> | undefined

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

interface Qa {
  question: string
  answer: string
}

const nextQuestions = ['Tell me more…', 'Tell me more… (x2)']

const processAnswer = async ({ input }: { input: Qa }) => {
  console.log('processAnswer', input)
  await new Promise((resolve) => setTimeout(resolve, 3000))
  if (nextQuestions.indexOf(input.question) === 1) {
    return { processedQuestion: input, outline: {} }
  }
  return {
    processedQuestion: input,
    nextQuestion: nextQuestions[nextQuestions.indexOf(input.question) + 1],
  }
}

const adogMachine = setup({
  actors: {
    processAnswer: fromPromise(processAnswer),
  },
  types: {
    context: {} as {
      processedQuestions: Qa[]
      currentQuestion: string
      currentAnswer: string
      generatedOutline: unknown
    },
  },
}).createMachine({
  context: {
    processedQuestions: [],
    currentQuestion: 'What kind of document do you want to write?',
    currentAnswer: '',
    generatedOutline: undefined,
  },
  id: 'ai-document-outline-generator',
  initial: 'standby',
  states: {
    standby: {
      on: {
        setAnswer: {
          actions: assign({
            currentAnswer: ({ event }) => event.answer,
          }),
        },
        continue: 'processing',
      },
    },
    processing: {
      entry: ({ context }) =>
        console.log('Processing', {
          question: context.currentQuestion,
          answer: context.currentAnswer,
        }),
      invoke: {
        src: 'processAnswer',
        input: ({ context }) => ({
          question: context.currentQuestion,
          answer: context.currentAnswer,
        }),
        onDone: [
          {
            guard: ({ event }) => 'outline' in event.output,
            target: 'done',
            actions: assign({
              processedQuestions: ({ context, event }) => [
                ...context.processedQuestions,
                event.output.processedQuestion,
              ],
              generatedOutline: ({ event }) => event.output.outline,
            }),
          },
          {
            target: 'standby',
            actions: assign({
              processedQuestions: ({ context, event }) => [
                ...context.processedQuestions,
                event.output.processedQuestion,
              ],
              currentQuestion: ({ event }) => event.output.nextQuestion!,
              currentAnswer: '',
            }),
          },
        ],
        onError: {
          target: 'standby',
          actions: ({ event }) => {
            console.error(event.error)
          },
        },
      },
    },
    done: {
      type: 'final',
      entry: ({ context }) =>
        console.log('Done', {
          answeredQuestions: context.processedQuestions,
          generatedOutline: context.generatedOutline,
        }),
    },
  },
  output: ({ context }) => context.generatedOutline,
})

export const AdogMachineContext = createActorContext(adogMachine, { inspect })

const spinner = (
  <svg
    className="animate-spin text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
)

const QaField = ({
  index,
  question,
  answer,
  onAnswerChange = () => {},
  onContinue = () => {},
  disabled = false,
  loading = false,
  autoFocus = false,
}: {
  index: number
  question: string
  answer: string
  onAnswerChange?: (answer: string) => void
  onContinue?: () => void
  disabled?: boolean
  loading?: boolean
  autoFocus?: boolean
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null!)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    inputRef.current.autocomplete = 'off'
  }, [])
  React.useEffect(() => {
    if (autoFocus) {
      inputRef.current.focus()
    }
  }, [autoFocus])
  return (
    <TextInput
      inputRef={inputRef}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          buttonRef.current!.click()
        }
      }}
      path={`ai-document-outline-generator-question-${index}`}
      value={answer}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => onAnswerChange(event.target.value)}
      label={question}
      readOnly={loading || disabled}
      AfterInput={
        !disabled && (
          <Button
            ref={buttonRef}
            disabled={loading}
            onClick={() => onContinue()}
            icon={loading ? spinner : <CornerDownLeft />}
            aria-label="Continue"
            tooltip="Continue"
            buttonStyle="icon-label"
            className="absolute top-[50%] right-3 m-0 -translate-y-1/2"
          />
        )
      }
    />
  )
}

const AiDocumentOutlineGenerator_ = () => {
  const snapshot = AdogMachineContext.useSelector((snapshot) => snapshot)
  const machine = AdogMachineContext.useActorRef()
  const currentQuestionIndex = snapshot.context.processedQuestions.length
  return (
    <div className={'card mb-5 flex-col pb-8'}>
      <div className={'card__title'}>AI document outline generator</div>
      {snapshot.context.processedQuestions.map(({ question, answer }, index) => {
        return <QaField key={index} index={index} question={question} answer={answer} disabled />
      })}
      {!snapshot.matches('done') && (
        <QaField
          key={currentQuestionIndex}
          index={currentQuestionIndex}
          question={snapshot.context.currentQuestion}
          answer={snapshot.context.currentAnswer}
          onAnswerChange={(answer) => machine.send({ type: 'setAnswer', answer })}
          onContinue={() => machine.send({ type: 'continue' })}
          loading={snapshot.matches('processing')}
          autoFocus={currentQuestionIndex > 0}
        />
      )}
      {snapshot.matches('done') && (
        <Banner icon={<span className="mr-2">🤖</span>} alignIcon="left" className="-mb-2">
          A document outline has been generated for you and applied to the document.
        </Banner>
      )}
    </div>
  )
}

const AiDocumentOutlineGenerator = () => {
  return (
    <AdogMachineContext.Provider>
      <AiDocumentOutlineGenerator_ />
    </AdogMachineContext.Provider>
  )
}

export default AiDocumentOutlineGenerator
