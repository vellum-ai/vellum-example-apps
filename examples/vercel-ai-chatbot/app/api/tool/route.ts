import { FunctionCallChatMessageContentValue as FunctionCallSerializer } from 'vellum-ai/serialization'

export async function POST(req: Request) {
  const json = await req.json()
  const functionCall = await FunctionCallSerializer.parseOrThrow(json)

  // Replace this with your own function call logic
  // Alternatively, you can setup a separate route for each function
  switch (functionCall.name) {
    case 'get_current_weather':
      return fetch(
        `http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${functionCall.arguments.location}&aqi=no`
      )
    default:
      return new Response(`Function ${functionCall.name} not found`, {
        status: 404
      })
  }
}
