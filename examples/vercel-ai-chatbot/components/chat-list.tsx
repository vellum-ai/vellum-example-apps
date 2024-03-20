import { Separator } from '@/components/ui/separator'
import { ChatMessageComponent } from '@/components/chat-message-component'
import { ChatMessage } from 'vellum-ai/api'
import { useMemo } from 'react'
import { IconOpenAI } from './ui/icons'

export interface ChatList {
  messages: ChatMessage[]
  isLoading?: boolean
}

export function ChatList({ messages, isLoading = false }: ChatList) {
  const lastMessage = useMemo(() => messages.slice(-1)[0], [messages])
  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.map((message, index) => (
        <div key={index}>
          <ChatMessageComponent message={message} />
          {index < messages.length - 1 && (
            <Separator className="my-4 md:my-8" />
          )}
        </div>
      ))}
      {isLoading && ['USER', 'FUNCTION'].includes(lastMessage.role) && (
        <div>
          <Separator className="my-4 md:my-8" />
          <div className={'relative mb-4 flex items-start md:-ml-12'}>
            <div
              className={
                'flex size-8 shrink-0 select-none items-center justify-center rounded-md border shadow'
              }
            >
              <IconOpenAI />
            </div>
            <div className="flex-1 px-1 ml-4 space-y-2 overflow-hidden italic">
              Typing...
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
