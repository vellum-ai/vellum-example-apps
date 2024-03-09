import { nanoid } from 'nanoid'
import { usePathname } from 'next/navigation'
import React from 'react'
import {
  ArrayChatMessageContentItem,
  ChatMessage,
  ChatMessageContent,
  FulfilledFunctionCall,
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
            return
          }

          resultChunk = await reader.read().catch(e => {
            if (e.name === 'AbortError') {
              return null
            }
            throw e
          })
          if (!resultChunk?.value) {
            return
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
              outputIds.push(parsedChunkValue.id)
              outputs[parsedChunkValue.id] = {
                type: 'FUNCTION_CALL',
                value: parsedChunkValue.value as FulfilledFunctionCall
              }
            }

            const assistantContent =
              outputIds.length === 1
                ? outputs[outputIds[0]] ?? {
                    type: 'STRING',
                    value: ''
                  }
                : {
                    type: 'ARRAY' as const,
                    value: outputIds
                      .map(id => outputs[id])
                      .filter(
                        (output): output is ArrayChatMessageContentItem =>
                          output !== null
                      )
                  }
            setMessages(
              request.messages.concat({
                role: 'ASSISTANT' as const,
                content: assistantContent
              })
            )
          })
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
        if (!path.includes('chat')) {
          window.history.pushState({}, '', `/chat/${id}`)
        }
      }

      const mostRecentMessage = messagesRef.current.slice(-1)[0]
      if (mostRecentMessage.content?.type === 'FUNCTION_CALL') {
        const functionCall = mostRecentMessage.content.value
        if (onFunctionCall) {
          const response = await onFunctionCall(functionCall)
          setMessages(
            messagesRef.current.concat({
              role: 'FUNCTION',
              content: {
                type: 'STRING',
                value: JSON.stringify(response)
              }
            })
          )
        }
      }
    },
    [id, onFunctionCall, path]
  )

  const append = React.useCallback(
    (message: ChatMessage) => {
      return triggerRequest({
        messages: messagesRef.current.concat(message),
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
