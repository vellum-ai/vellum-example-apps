import { auth } from '@/auth'
import { VellumClient } from 'vellum-ai'

const vellum = new VellumClient({
  apiKey: process.env.VELLUM_API_KEY!
})

export async function POST(req: Request) {
  const json = await req.json()
  const user = (await auth())?.user
  if (!user) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const { messageId, quality, comment } = json as {
    messageId: string
    quality: number
    comment: string
  }

  try {
    await vellum.submitWorkflowExecutionActuals({
      executionId: messageId,
      actuals: [
        {
          quality,
          outputKey: 'answer',
          outputType: 'STRING',
          metadata: {
            comment,
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            }
          }
        }
      ]
    })
  } catch (error) {
    return new Response((error as Error).message, { status: 500 })
  }

  return new Response('', { status: 200 })
}
