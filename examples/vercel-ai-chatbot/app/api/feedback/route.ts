import { VellumClient } from 'vellum-ai'

const vellum = new VellumClient({
  apiKey: process.env.VELLUM_API_KEY!
})

export async function POST(req: Request) {
  const json = await req.json()
  const { messageId, quality } = json as { messageId: string; quality: number }

  try {
    await vellum.submitWorkflowExecutionActuals({
      executionId: messageId,
      actuals: [{ quality, outputKey: 'final-output', outputType: 'STRING' }]
    })
  } catch (error) {
    return new Response((error as Error).message, { status: 500 })
  }

  return new Response('', { status: 200 })
}
