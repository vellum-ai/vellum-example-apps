import { addChat, saveChatMessages } from '@/app/actions'
import { nanoid } from 'nanoid'
import { usePathname } from 'next/navigation'
import React, { useCallback } from 'react'
import { toast } from 'react-hot-toast'
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

  const [messages, _setMessages] =
    React.useState<ChatMessage[]>(initialMessages)
  const messagesRef = React.useRef<ChatMessage[]>(messages)
  const setMessages = useCallback(
    async (newMessages: ChatMessage[], persist: boolean) => {
      if (persist) {
        await saveChatMessages({ id, messages: newMessages })
        messagesRef.current = newMessages
      }
      console.log('_setMessages', newMessages)
      _setMessages(newMessages)
      console.log('_setMessages done', newMessages)
    },
    [id, _setMessages]
  )
  console.log('useState Messages', messages)

  const triggerRequest = React.useCallback(async () => {
    setIsLoading(true)
    if (!path.includes('chat')) {
      const userMessage = messagesRef.current.find(
        m => m.role === 'USER' && m.content?.type === 'STRING'
      )
      const defaultChatTitle =
        (userMessage?.content?.value as string)?.slice(0, 10) ?? 'New chat'

      await addChat({
        id,
        title: defaultChatTitle
      })
      window.history.pushState({}, '', `/chat/${id}`)
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
        body: JSON.stringify({ id, messages: messagesRef.current })
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
        const outputChunkAsString = decoder.decode(resultChunk.value)
        const cleanedOutputChunkAsString = outputChunkAsString
          .split(/[\n\r]+/)
          .map(s => s.trim())
          .filter(s => s !== '')
          .join(', ')
        const parsedEventOutputArray = JSON.parse(
          `[${cleanedOutputChunkAsString}]`
        ) as WorkflowResultEventOutputData[]

        for (const parsedEventOutput of parsedEventOutputArray) {
          if (
            parsedEventOutput.state === 'REJECTED' &&
            parsedEventOutput.type === 'ERROR'
          ) {
            throw new Error(parsedEventOutput.value?.message)
          }

          if (!parsedEventOutput.id) {
            return
          }

          if (parsedEventOutput.state === 'INITIATED') {
            outputIds.push(parsedEventOutput.id)
            outputs[parsedEventOutput.id] = null
          } else if (parsedEventOutput.state === 'STREAMING') {
            const existingOutput = outputs[parsedEventOutput.id]
            if (existingOutput == null) {
              outputs[parsedEventOutput.id] = {
                type: 'STRING',
                value: parsedEventOutput.delta as string
              }
            } else if (existingOutput.type === 'STRING') {
              existingOutput.value += parsedEventOutput.delta as string
            }
          } else if (parsedEventOutput.state === 'FULFILLED') {
            if (
              parsedEventOutput.type === 'FUNCTION_CALL' &&
              parsedEventOutput.value &&
              parsedEventOutput.value.state === 'FULFILLED'
            ) {
              outputIds.push(parsedEventOutput.id)
              const { state, ...value } = parsedEventOutput.value
              if (state === 'FULFILLED') {
                outputs[parsedEventOutput.id] = {
                  type: 'FUNCTION_CALL',
                  value
                }
              }
            }
          }

          const contentOutputs = outputIds
            .map(id => outputs[id])
            .filter(
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
            await setMessages(
              messagesRef.current.concat({
                role: 'ASSISTANT',
                content: assistantContent
              }),
              parsedEventOutput.state === 'FULFILLED'
            )
          }
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
          await setMessages(newMessages, true)
          await triggerRequest()
        }
      }
    } catch (error) {
      toast.error((error as Error).message)
    }
    setIsLoading(false)
  }, [id, onFunctionCall, path, setMessages])

  const append = React.useCallback(
    async (message: ChatMessage) => {
      const newMessages = messagesRef.current.concat(message)
      await setMessages(newMessages, true)
      return triggerRequest()
    },
    [setMessages, triggerRequest]
  )

  const reload = React.useCallback(
    async (index: number) => {
      const newMessages = messagesRef.current.slice(0, index + 1)
      await setMessages(newMessages, true)
      return triggerRequest()
    },
    [setMessages, triggerRequest]
  )

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
