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
      console.log('functionCall', functionCall)
      const functionCallResponse = await fetch('/api/tool', {
        method: 'POST',
        body: JSON.stringify(functionCall)
      })
      console.log('functionCallResponse', functionCallResponse)
      if (functionCallResponse.status !== 200) {
        return {
          error: true,
          status: functionCallResponse.status,
          message: await functionCallResponse.text()
        }
      }
      return await functionCallResponse.json()
    }
  })

  return (
    <>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {messages.length ? (
          <>
            <ChatList messages={messages} isLoading={isLoading} />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : (
          <EmptyScreen />
        )}
      </div>
      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stop}
        append={append}
        reload={reload}
        messages={messages}
      />
    </>
  )
}
