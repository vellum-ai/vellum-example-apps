import { StreamingTextResponse } from 'ai'
import { VellumClient } from 'vellum-ai'

import { auth } from '@/auth'
import { z } from 'zod'
import { ChatMessageRole } from 'vellum-ai/api/types'

export const runtime = 'edge'

const vellum = new VellumClient({
  apiKey: process.env.VELLUM_API_KEY
})

const zBody = z.object({
  messages: z
    .object({
      role: z.enum(['user']),
      content: z.string()
    })
    .array()
})

export async function POST(req: Request) {
  const json = await req.json()
  const { messages } = zBody.parse(json)
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
          role: m.role.toUpperCase() as ChatMessageRole,
          text: m.content
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
          controller.enqueue(JSON.stringify(event.data.error!))
          controller.close()
          break
        }
        if (event.data.state === 'INITIATED') {
          continue
        }
        if (event.data.state === 'STREAMING') {
          const output = event.data.output!
          if (output.state === 'STREAMING') {
            controller.enqueue(output.delta)
          }
          // if (output.state === 'FULFILLED' && output.type === 'FUNCTION_CALL') {
          //   controller.enqueue(output.value)
          // }
        }
        if (event.data.state === 'FULFILLED') {
          controller.close()
        }
      }
    }
  })

  return new StreamingTextResponse(stream)
}
