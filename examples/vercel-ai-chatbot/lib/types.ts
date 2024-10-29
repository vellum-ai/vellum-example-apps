import { ChatMessage } from 'vellum-ai/api'

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  messages: ChatMessage[]
  workflowDeploymentId: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>
