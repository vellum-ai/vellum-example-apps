import { editChat } from '@/app/actions'
import { nanoid } from 'nanoid'
import { usePathname } from 'next/navigation'
import React from 'react'
import {
  ArrayChatMessageContentItem,
  ChatMessage,
  ChatMessageContent,
  FulfilledFunctionCall,
  FunctionCall,
  WorkflowResultEventOutputData
} from 'vellum-ai/api'

const useVellumChat = ({
  initialMessages = [],
  chatId,
  onFunctionCall
}: {
  initialMessages?: ChatMessage[]
  chatId?: string
  onFunctionCall?: (functionCall: FulfilledFunctionCall) => Promise<unknown>
}) => {
  const id = React.useMemo(() => chatId ?? nanoid(), [chatId])
  const path = usePathname()
  const abortControllerRef = React.useRef<AbortController | null>()
  const [isLoading, setIsLoading] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages)
  const messagesRef = React.useRef<ChatMessage[]>(messages)
  React.useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const triggerRequest = React.useCallback(
    async (request: { messages: ChatMessage[]; id: string }) => {
      setIsLoading(true)
      if (!path.includes('chat')) {
        window.history.pushState({}, '', `/chat/${id}`)
        await editChat({
          id,
          title:
            (
              request.messages.find(m => m.role === 'USER')?.content
                ?.value as string
            )?.slice(0, 20) ?? 'New chat'
        })
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          signal: abortController.signal,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        })
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        if (!response.body) {
          throw new Error('No response body')
        }
        const reader = response.body.getReader()

        let resultChunk: ReadableStreamReadResult<Uint8Array> | null = null
        const outputs: Record<string, ChatMessageContent | null> = {}
        const outputIds: string[] = []
        while (!resultChunk?.done) {
          if (abortController.signal.aborted) {
            break
          }

          resultChunk = await reader.read().catch(e => {
            if (e.name === 'AbortError') {
              return null
            }
            throw e
          })
          if (!resultChunk?.value) {
            break
          }

          const decoder = new TextDecoder('utf-8')
          const resultChunkValueString = decoder.decode(resultChunk.value)
          const cleanedChunkValueString = resultChunkValueString
            .split(/[\n\r]+/)
            .map(s => s.trim())
            .filter(s => s !== '')
            .join(', ')
          const parsedChunkValueArray = JSON.parse(
            `[${cleanedChunkValueString}]`
          ) as WorkflowResultEventOutputData[]

          parsedChunkValueArray.forEach(parsedChunkValue => {
            if (!parsedChunkValue.id) {
              return
            }

            if (parsedChunkValue.state === 'INITIATED') {
              outputIds.push(parsedChunkValue.id)
              outputs[parsedChunkValue.id] = null
            } else if (parsedChunkValue.state === 'STREAMING') {
              const existingOutput = outputs[parsedChunkValue.id]
              if (existingOutput == null) {
                outputs[parsedChunkValue.id] = {
                  type: 'STRING',
                  value: parsedChunkValue.delta as string
                }
              } else if (existingOutput.type === 'STRING') {
                existingOutput.value += parsedChunkValue.delta as string
              }
            } else if (parsedChunkValue.state === 'FULFILLED') {
              if (
                parsedChunkValue.type === 'FUNCTION_CALL' &&
                parsedChunkValue.value &&
                parsedChunkValue.value.state === 'FULFILLED'
              ) {
                outputIds.push(parsedChunkValue.id)
                const { state, ...value } = parsedChunkValue.value
                if (state === 'FULFILLED') {
                  outputs[parsedChunkValue.id] = {
                    type: 'FUNCTION_CALL',
                    value
                  }
                }
              }
            }

            const contentOutputs = outputIds
              .map(id => outputs[id])
              .filter(
                (output): output is ArrayChatMessageContentItem =>
                  output !== null
              )
            if (contentOutputs.length > 0) {
              const assistantContent =
                contentOutputs.length === 1
                  ? contentOutputs[0]
                  : {
                      type: 'ARRAY' as const,
                      value: contentOutputs
                    }
              setMessages(
                request.messages.concat({
                  role: 'ASSISTANT',
                  content: assistantContent
                })
              )
            }
          })
        }
      } catch (error) {
        console.error(error)
      }

      const mostRecentMessage = messagesRef.current.slice(-1)[0]
      if (mostRecentMessage.content?.type === 'FUNCTION_CALL') {
        const functionCall = mostRecentMessage.content.value
        if (onFunctionCall) {
          const response = await onFunctionCall(functionCall)
          const newMessages = messagesRef.current.concat({
            role: 'FUNCTION',
            content: {
              type: 'STRING',
              value: JSON.stringify(response)
            },
            source: functionCall.id
          })
          setMessages(newMessages)
          await triggerRequest({
            messages: newMessages,
            id: request.id
          })
        }
      } else {
        setIsLoading(false)
      }
    },
    [id, onFunctionCall, path]
  )

  const append = React.useCallback(
    (message: ChatMessage) => {
      const newMessages = messagesRef.current.concat(message)
      setMessages(newMessages)
      return triggerRequest({
        messages: newMessages,
        id
      })
    },
    [id, triggerRequest]
  )

  const reload = React.useCallback(() => {
    return triggerRequest({
      messages: messagesRef.current,
      id
    })
  }, [id, triggerRequest])

  const stop = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])
  return {
    messages,
    append,
    reload,
    stop,
    isLoading
  }
}

export default useVellumChat
