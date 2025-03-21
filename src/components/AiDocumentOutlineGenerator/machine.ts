import { useAllFormFields } from '@payloadcms/ui'
import { createActorContext } from '@xstate/react'
import { assign, fromPromise, setup } from 'xstate'

import { inspect } from '@/xstate-inspect'
import { processAnswer } from './actions'
import { initialRichTextEditorState } from './initialRichTextEditorState'
import { Qa } from './types'

/** Wrapper to avoid errors from XState attempting to send unserializable stuff to XState Inspect. */
type RefGetter<T> = {
  getRef: () => T
}

const adogMachine = setup({
  actors: {
    processAnswer: fromPromise(async ({ input }: { input: Qa[] }) => {
      return await processAnswer({ input })
    }),
  },
  types: {
    context: {} as {
      dispatchFields: RefGetter<ReturnType<typeof useAllFormFields>[1]>
      processedQuestions: Qa[]
      currentQuestion: string
      currentAnswer: string
    },
    input: {} as {
      dispatchFields: RefGetter<ReturnType<typeof useAllFormFields>[1]>
    },
  },
}).createMachine({
  context: ({ input }) => ({
    dispatchFields: input.dispatchFields,
    processedQuestions: [],
    currentQuestion: 'What kind of document do you want to write?',
    currentAnswer: '',
  }),
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
        input: ({ context }) => [
          ...context.processedQuestions,
          { question: context.currentQuestion, answer: context.currentAnswer },
        ],
        onDone: [
          {
            guard: ({ event }) => 'outline' in event.output,
            target: 'done',
            actions: assign({
              processedQuestions: ({ context }) => [
                ...context.processedQuestions,
                { question: context.currentQuestion, answer: context.currentAnswer },
              ],
              currentQuestion: '',
              currentAnswer: '',
            }),
          },
          {
            target: 'standby',
            actions: assign({
              processedQuestions: ({ context }) => [
                ...context.processedQuestions,
                { question: context.currentQuestion, answer: context.currentAnswer },
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
      entry: ({ context, event }) => {
        console.log('Done', {
          processedQuestions: context.processedQuestions,
          outline: event.output.outline,
        })
        const dispatchFields = context.dispatchFields.getRef()
        dispatchFields({
          path: 'content',
          type: 'UPDATE',
          initialValue: initialRichTextEditorState,
          value: event.output.outline,
        })
      },
    },
  },
})

export const AdogMachineContext = createActorContext(adogMachine, { inspect })
