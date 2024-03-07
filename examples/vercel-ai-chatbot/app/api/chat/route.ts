import { kv } from '@vercel/kv'
import { StreamingTextResponse } from 'ai'
import { VellumClient } from 'vellum-ai'

import { auth } from '@/auth'
import { z } from 'zod'
import { ChatMessageRole } from 'vellum-ai/api/types'

export const runtime = 'edge'

const vellum = new VellumClient({
  apiKey: process.env.VELLUM_API_KEY!
})

const zBody = z.object({
  id: z.string(),
  messages: z
    .object({
      role: z
        .enum(['user', 'assistant', 'function', 'system', 'tool'])
        .transform<ChatMessageRole>(s =>
          s === 'tool' ? 'FUNCTION' : (s.toUpperCase() as ChatMessageRole)
        ),
      content: z.string()
    })
    .array()
})

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, id } = zBody.parse(json)
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
        value: messages.map(m => ({
          role: m.role,
          text:
            m.role === 'FUNCTION'
              ? JSON.stringify({ content: m.content, tool_call_id: '' })
              : m.content
        })),
        name: 'messages'
      }
    ]
  })

  const stream = new ReadableStream({
    async pull(controller) {
      for await (const event of res) {
        if (event.type !== 'WORKFLOW') {
          continue
        }
        if (event.data.state === 'REJECTED') {
          controller.enqueue(
            `We failed to resolve the latest message. Here's why: ${JSON.stringify(event.data.error!)}

For demo purposes, here's what I'm supposed to say:

The temperature in Miami is 75 degrees!`
          )
          controller.close()
          break
        }
        if (event.data.state === 'INITIATED') {
          continue
        }
        if (event.data.state === 'STREAMING') {
          const output = event.data.output!
          if (output.name == 'text-output') {
            if (
              output.state === 'STREAMING' &&
              !(output.delta as string)?.includes('FulfilledFunctionCall')
            ) {
              controller.enqueue(output.delta)
            }
            if (
              output.state === 'FULFILLED' &&
              (output.value as string)?.includes('tool_calls')
            ) {
              controller.enqueue(output.value)
            }
          }
        }
        if (event.data.state === 'FULFILLED') {
          controller.close()
        }
      }
    }
  })
  await kv.hmset(`chat:${id}`, {
    // TODO
  })
  await kv.zadd(`user:chat:${userId}`, {
    score: Date.now(),
    member: `chat:${id}`
  })

  return new StreamingTextResponse(stream)
}
