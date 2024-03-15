import { Separator } from '@/components/ui/separator'
import { ChatMessageComponent } from '@/components/chat-message-component'
import { ChatMessage } from 'vellum-ai/api'

export interface ChatList {
  messages: ChatMessage[]
  reload?: (index: number) => Promise<void>
}

export function ChatList({ messages, reload }: ChatList) {
  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.map((message, index) => (
        <div key={index}>
          <ChatMessageComponent
            message={message}
            reload={async () => reload?.(index)}
          />
          {index < messages.length - 1 && (
            <Separator className="my-4 md:my-8" />
          )}
        </div>
      ))}
    </div>
  )
}
