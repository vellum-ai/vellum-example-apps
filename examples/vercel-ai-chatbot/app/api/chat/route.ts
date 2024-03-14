import { kv } from '@vercel/kv'
import { VellumClient } from 'vellum-ai'
import { ChatMessage as ChatMessageSerializer } from 'vellum-ai/serialization'
import { serialization } from 'vellum-ai/core'

import { auth } from '@/auth'
import { WorkflowOutput } from 'vellum-ai/api'
import { nanoid } from 'nanoid'

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

  const res = await vellum.executeWorkflowStream({
    workflowDeploymentName: 'vercel-chatbot-demo',
    releaseTag: 'production',
    inputs: [
      {
        type: 'CHAT_HISTORY',
        value: messages,
        name: 'messages'
      }
    ]
  })

  const stream = new ReadableStream({
    async pull(controller) {
      // TODO: Remove this hack - need some changes on Vellum side
      let isFunctionCall = false
      let startedStreaming = false

      for await (const event of res) {
        if (event.type !== 'WORKFLOW') {
          continue
        }
        if (event.data.state === 'REJECTED') {
          controller.error(
            `We failed to resolve the latest message. Here's why: ${JSON.stringify(event.data.error!)}`
          )
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
          if (!isFunctionCall && output.name == 'text-output') {
            controller.enqueue(JSON.stringify(output) + '\n')
          }
        }
        if (event.data.state === 'FULFILLED') {
          if (!isFunctionCall) {
            const stringOutputType = event.data.outputs?.find(
              (o): o is WorkflowOutput.String => o.type === 'STRING'
            )
            await kv.hset(`chat:${id}`, {
              messages: messages.concat({
                role: 'ASSISTANT' as const,
                content: stringOutputType
              })
            })
            await kv.zadd(`user:chat:${userId}`, {
              score: Date.now(),
              member: `chat:${id}`
            })
          } else {
            const arrayOutputType = event.data.outputs?.find(
              (o): o is WorkflowOutput.Array => o.type === 'ARRAY'
            )
            const functionCallItem = arrayOutputType?.value[0]
            if (
              functionCallItem?.type === 'FUNCTION_CALL' &&
              functionCallItem?.value.state === 'FULFILLED'
            ) {
              controller.enqueue(
                JSON.stringify({
                  state: 'FULFILLED',
                  value: functionCallItem.value,
                  type: 'FUNCTION_CALL',
                  id: nanoid()
                }) + '\n'
              )
              await kv.hset(`chat:${id}`, {
                messages: messages.concat({
                  role: 'ASSISTANT' as const,
                  content: {
                    type: 'FUNCTION_CALL',
                    value: functionCallItem.value
                  }
                })
              })
              await kv.zadd(`user:chat:${userId}`, {
                score: Date.now(),
                member: `chat:${id}`
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
