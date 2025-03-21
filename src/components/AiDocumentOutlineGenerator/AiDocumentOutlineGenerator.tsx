'use client'

import { Banner, Button, TextInput, useAllFormFields } from '@payloadcms/ui'
import { CornerDownLeft } from 'lucide-react'
import React from 'react'

import { AdogMachineContext } from './machine'

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

export const AiDocumentOutlineGenerator = () => {
  const [, dispatch] = useAllFormFields()
  return (
    <AdogMachineContext.Provider
      options={{
        input: {
          dispatchFields: {
            getRef: () => dispatch,
          },
        },
      }}
    >
      <AiDocumentOutlineGenerator_ />
    </AdogMachineContext.Provider>
  )
}
