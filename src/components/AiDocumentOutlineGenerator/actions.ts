'use server'

import {
  convertHTMLToLexical,
  DefaultNodeTypes,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { JSDOM } from 'jsdom'
import { marked } from 'marked'
import { headers as getHeaders } from 'next/headers'
import { unauthorized } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { Qa } from './types'

type RecursiveNodes<T> = {
  children?: RecursiveNodes<T>[]
} & T

const removeH1Tags = (node: RecursiveNodes<DefaultNodeTypes>) => {
  if (node.children == null) {
    return
  }
  const filteredChildren: RecursiveNodes<DefaultNodeTypes>[] = []
  for (const child of node.children) {
    if (child.type === 'heading' && child.tag === 'h1') {
      continue
    }
    removeH1Tags(child)
    filteredChildren.push(child)
  }
  node.children = filteredChildren
}

export const processAnswer = async ({ input }: { input: Qa[] }) => {
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const user = await payload.auth({ headers })
  if (user == null) {
    return unauthorized()
  }
  if (input.length >= 3) {
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      system:
        'Your job is to analyze a conversation and based on it draft an outline for a document. ' +
        'The outline should be drafted in Markdown syntax. ' +
        'Use different levels of headings to convey document structure. Do not use bullet point lists.' +
        'As placeholder for where the writer should write "actual content", use the string "🚧 TBD".' +
        'Below the TBDs you may write additional information about what kind of content is supposed to go into said chapter.' +
        'Respond only with the draft outline.',
      prompt: input
        .flatMap(({ question, answer }) => [
          { role: 'assistant', content: question },
          { role: 'user', content: answer },
        ])
        .map(({ role, content }) => `${role}: "${content}"`)
        .join('\n'),
    })
    console.log(text)
    const html = await marked.parse(text.split('\n').slice(1, -1).join('\n'), { async: true })
    console.log(html)
    const outline = convertHTMLToLexical({
      editorConfig: await editorConfigFactory.default({
        config: payload.config,
      }),
      html,
      JSDOM,
    })
    removeH1Tags(outline.root as never)
    return { outline: outline }
  }
  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    system:
      'Your job is to help the user produce an outline for a document that they want to write. ' +
      'In order to do that you must ask them questions to get a better understanding of what kind of document they want to write. ' +
      'Each consecutive question should aim to narrow down what kind of document the user wants to write. ' +
      'You can only ask one question at a time. Questions should be short and direct.',
    messages: input.flatMap(({ question, answer }) => [
      { role: 'assistant', content: question },
      { role: 'user', content: answer },
    ]),
  })
  return {
    nextQuestion: text,
  }
}
