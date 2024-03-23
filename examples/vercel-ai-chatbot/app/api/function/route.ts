import { FunctionCallChatMessageContentValue as FunctionCallSerializer } from 'vellum-ai/serialization'

export async function POST(req: Request) {
  const json = await req.json()
  const functionCall = await FunctionCallSerializer.parseOrThrow(json)

  // Replace this with your own function call logic
  // Alternatively, you can setup a separate route for each function
  switch (functionCall.name) {
    case 'get_current_weather':
      const url = `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${functionCall.arguments.location}&aqi=no`
      const response = await fetch(url, {
        headers: { Accept: 'application/json' }
      })
      return new Response(await response.text(), {
        status: response.status
      })
    default:
      return new Response(`Function ${functionCall.name} not found`, {
        status: 404
      })
  }
}
