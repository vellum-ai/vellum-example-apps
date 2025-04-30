import { addChat } from '@/app/actions'
import React from 'react'
import { toast } from 'react-hot-toast'
import {
  ArrayChatMessageContentItem,
  ChatMessage,
  ChatMessageContent,
  FunctionCall,
  WorkflowResultEventOutputData
} from 'vellum-ai/api'
import { nanoid } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { UINT32_SIZE } from '@/lib/constants'

function concatBuffers(a: Uint8Array, b: Uint8Array) {
  const result = new Uint8Array(a.length + b.length)
  result.set(a, 0)
  result.set(b, a.length)
  return result
}

const useVellumChat = ({
  initialMessages = [],
  initialChatId,
  workflowDeploymentId,
  onFunctionCall
}: {
  initialMessages?: ChatMessage[]
  initialChatId?: string
  workflowDeploymentId: string
  onFunctionCall?: (functionCall: FunctionCall) => Promise<unknown>
}) => {
  const id = React.useMemo(() => initialChatId ?? nanoid(), [initialChatId])
  const abortControllerRef = React.useRef<AbortController | null>()
  const [isLoading, setIsLoading] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages)
  const messagesRef = React.useRef<ChatMessage[]>(messages)
  const router = useRouter()
  React.useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const triggerRequest = React.useCallback(
    async (request: {
      messages: ChatMessage[]
      id: string
      workflowDeploymentId: string
    }) => {
      setIsLoading(true)

      const outputs: Record<string, ChatMessageContent | null> = {}
      const onOutputEvent = (
        parsedChunkValue: WorkflowResultEventOutputData
      ) => {
        if (
          parsedChunkValue.state === 'REJECTED' &&
          parsedChunkValue.type === 'ERROR'
        ) {
          throw new Error(parsedChunkValue.value?.message)
        }

        if (!parsedChunkValue.id) {
          return
        }

        if (parsedChunkValue.state === 'INITIATED') {
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
            const { state, ...value } = parsedChunkValue.value
            if (state === 'FULFILLED') {
              outputs[parsedChunkValue.id] = {
                type: 'FUNCTION_CALL',
                value
              }
            }
          } else if (
            parsedChunkValue.type === 'STRING' &&
            !outputs[parsedChunkValue.id]
          ) {
            outputs[parsedChunkValue.id] = {
              type: 'STRING',
              value: parsedChunkValue.value as string
            }
          }
        }

        const contentOutputs = Object.values(outputs).filter(
          (output): output is ArrayChatMessageContentItem => output !== null
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
        const decoder = new TextDecoder()
        let buffer = new Uint8Array()
        let resultChunk: ReadableStreamReadResult<Uint8Array> | null = null
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
          if (resultChunk?.done || !resultChunk) {
            break
          }

          buffer = concatBuffers(buffer, resultChunk.value)
          while (buffer.length >= 4) {
            const eventLength = new DataView(buffer.buffer).getUint32(0, false)
            if (buffer.length < eventLength + UINT32_SIZE) {
              break
            }

            const eventEncoded = buffer.subarray(
              UINT32_SIZE,
              UINT32_SIZE + eventLength
            )
            buffer = buffer.slice(UINT32_SIZE + eventLength)

            onOutputEvent(JSON.parse(decoder.decode(eventEncoded)))
          }
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
              id: request.id,
              workflowDeploymentId
            })
          }
        }
      } catch (error) {
        toast.error((error as Error).message)
      }
      setIsLoading(false)
    },
    [onFunctionCall, workflowDeploymentId]
  )

  const append = React.useCallback(
    async (value: string) => {
      const message: ChatMessage = {
        content: {
          type: 'STRING',
          value
        },
        role: 'USER'
      }

      if (!window.location.pathname.includes('chat')) {
        await addChat({
          id,
          value,
          workflowDeploymentId
        })
        window.history.pushState({}, '', `/chat/${id}`)
      }
      const newMessages = messagesRef.current.concat(message)
      setMessages(newMessages)
      await triggerRequest({
        messages: newMessages,
        id,
        workflowDeploymentId
      })

      if (!initialChatId) {
        router.push(`/chat/${id}`)
        router.refresh()
      }
    },
    [id, initialChatId, router, triggerRequest, workflowDeploymentId]
  )

  const reload = React.useCallback(() => {
    const lastAssistantMessageIndex = messagesRef.current.findLastIndex(
      msg => msg.role === 'ASSISTANT'
    )
    if (lastAssistantMessageIndex === -1) {
      return triggerRequest({
        messages: messagesRef.current,
        id,
        workflowDeploymentId
      })
    }

    const messagesToReload = messagesRef.current.slice(
      0,
      lastAssistantMessageIndex
    )
    setMessages(messagesToReload)
    return triggerRequest({
      messages: messagesToReload,
      id,
      workflowDeploymentId
    })
  }, [id, triggerRequest, workflowDeploymentId])

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
    isLoading,
    id
  }
}

export default useVellumChat
