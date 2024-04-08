import { kv } from '@vercel/kv'
import { VellumClient } from 'vellum-ai'
import { VellumError as VellumHTTPError } from 'vellum-ai/errors'
import { ChatMessage as ChatMessageSerializer } from 'vellum-ai/serialization'
import { serialization } from 'vellum-ai/core'

import { auth } from '@/auth'
import { WorkflowOutput } from 'vellum-ai/api'
import { nanoid } from 'nanoid'
import { UINT32_SIZE } from '@/lib/constants'
import { cdktfIndex } from '@/workspace/searchIndexes'

export const runtime = 'edge'

const vellum = new VellumClient({
  apiKey: process.env.VELLUM_API_KEY!
})

const requestBodySerializer = serialization.object({
  id: serialization.string(),
  messages: serialization.list(ChatMessageSerializer)
})

class StreamingTextResponse extends Response {
  constructor(res: ReadableStream, init?: ResponseInit) {
    super(res, {
      ...init,
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...(init == null ? void 0 : init.headers)
      }
    })
  }
}

export async function POST(req: Request) {
  const json = await req.json()
  const { id, messages } = await requestBodySerializer.parseOrThrow(json)
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const searchResults = await vellum.search({
    indexName: cdktfIndex.name,
    query: 'cdktf'
  })
  console.log(searchResults)

  const res = await vellum
    .executeWorkflowStream({
      workflowDeploymentName: 'trust-center-bot',
      inputs: [
        {
          type: 'CHAT_HISTORY',
          value: messages,
          name: 'chat_history'
        }
      ]
    })
    .then(stream => {
      return {
        ok: true as const,
        stream
      }
    })
    .catch(err => {
      return {
        ok: false as const,
        response: err as VellumHTTPError
      }
    })

  if (!res.ok) {
    // We need to improve the error message returned and not require users to wrap our responses with `ok`
    // https://app.shortcut.com/vellum/story/2064
    return new Response(res.response.message, {
      status: res.response.statusCode
    })
  }

  const stream = new ReadableStream({
    async pull(controller) {
      const encoder = new TextEncoder()

      // Emit a JSON event to the client
      // We use a content type strategy where we first encode the length of the strinigified event
      // before encoding the event itself
      const emit = (event: unknown) => {
        const jsonString = JSON.stringify(event)
        const lengthBuffer = new Uint8Array(UINT32_SIZE)
        new DataView(lengthBuffer.buffer).setUint32(0, jsonString.length, false)
        controller.enqueue(Buffer.from(lengthBuffer.buffer))
        controller.enqueue(encoder.encode(jsonString))
      }

      // TODO: Remove this hack - need some changes on Vellum side
      let isFunctionCall = false
      let startedStreaming = false

      for await (const event of res.stream) {
        if (event.type !== 'WORKFLOW') {
          continue
        }
        if (event.data.state === 'REJECTED') {
          emit({
            state: 'REJECTED',
            type: 'ERROR',
            value: event.data.error
          })
          controller.close()
          break
        }
        if (event.data.state === 'INITIATED') {
          console.log('Workflow initiated', event.executionId)
          continue
        }
        if (event.data.state === 'STREAMING') {
          const output = event.data.output!
          if (!startedStreaming && output.state === 'STREAMING') {
            startedStreaming = true
            if (output.delta?.startsWith('{')) {
              isFunctionCall = true
            }
          }
          if (!isFunctionCall && output.name == 'final-output') {
            emit(output)
          }
        }
        if (event.data.state === 'FULFILLED') {
          if (!isFunctionCall) {
            const stringOutputType = event.data.outputs?.find(
              (o): o is WorkflowOutput.String => o.type === 'STRING'
            )
            if (stringOutputType?.value) {
              await kv.hset(`chat:${id}`, {
                messages: messages.concat({
                  source: event.executionId,
                  role: 'ASSISTANT' as const,
                  content: {
                    type: 'STRING',
                    value: stringOutputType?.value
                  }
                })
              })
            }
          } else {
            const arrayOutputType = event.data.outputs?.find(
              (o): o is WorkflowOutput.Array => o.type === 'ARRAY'
            )
            const functionCallItem = arrayOutputType?.value?.[0]
            if (
              functionCallItem?.type === 'FUNCTION_CALL' &&
              functionCallItem?.value.state === 'FULFILLED'
            ) {
              emit({
                state: 'FULFILLED',
                value: functionCallItem.value,
                type: 'FUNCTION_CALL',
                id: nanoid()
              })
              await kv.hset(`chat:${id}`, {
                messages: messages.concat({
                  source: event.executionId,
                  role: 'ASSISTANT' as const,
                  content: {
                    type: 'FUNCTION_CALL',
                    value: {
                      id: functionCallItem.value.id,
                      name: functionCallItem.value.name,
                      arguments: functionCallItem.value.arguments
                    }
                  }
                })
              })
            }
          }
          controller.close()
        }
      }
    }
  })

  return new StreamingTextResponse(stream)
}
