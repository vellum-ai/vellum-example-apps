'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { ChatMessage, SlimWorkflowDeployment } from 'vellum-ai/api'
import useVellumChat from '@/lib/hooks/use-vellum-chat'
import { useState } from 'react'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: ChatMessage[]
  initialChatId?: string
  defaultWorkflowDeploymentId: string
  deployments?: SlimWorkflowDeployment[]
}

export function Chat({
  initialChatId,
  initialMessages,
  deployments,
  defaultWorkflowDeploymentId,
  className
}: ChatProps) {
  const [selectedWorkflowDeploymentId, setSelectedWorkflowDeploymentId] =
    useState(defaultWorkflowDeploymentId)

  const { messages, append, reload, stop, isLoading, id } = useVellumChat({
    initialMessages,
    initialChatId,
    workflowDeploymentId: selectedWorkflowDeploymentId,
    async onFunctionCall(functionCall) {
      const functionCallResponse = await fetch('/api/function', {
        method: 'POST',
        body: JSON.stringify(functionCall)
      })
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
            <ChatList
              messages={messages}
              isLoading={isLoading}
              workflowDeploymentId={selectedWorkflowDeploymentId}
            />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : (
          <EmptyScreen
            deployments={deployments}
            onDeploymentIdChange={setSelectedWorkflowDeploymentId}
          />
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
