'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { ChatMessage } from 'vellum-ai/api'
import useVellumChat from '@/lib/hooks/use-vellum-chat'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: ChatMessage[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const { messages, append, reload, stop, isLoading } = useVellumChat({
    initialMessages,
    chatId: id,
    async onFunctionCall(functionCall) {
      // Replace this with your own function call
      await new Promise(resolve => setTimeout(resolve, 2000))
      switch (functionCall.name) {
        case 'get_current_weather':
          return { temperature: 75, metric: 'degrees', unit: 'F' }
        default:
          return { notFound: true }
      }
    }
  })

  return (
    <>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {messages.length ? (
          <>
            <ChatList messages={messages} reload={reload} />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : (
          <EmptyScreen append={append} />
        )}
      </div>
      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stop}
        append={append}
        messages={messages}
      />
    </>
  )
}
