import { VellumClient } from 'vellum-ai'

const vellum = new VellumClient({
  apiKey: process.env.VELLUM_API_KEY!
})

export async function POST(req: Request) {
  const json = await req.json()
  const { messageId, quality } = json as { messageId: string; quality: number }

  await vellum.submitWorkflowExecutionActuals({
    externalId: messageId,
    actuals: [{ quality, outputKey: 'final-output', outputType: 'STRING' }]
  })

  return new Response('', { status: 204 })
}
