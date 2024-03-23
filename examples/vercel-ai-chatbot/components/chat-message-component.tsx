// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx

import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { IconVellum, IconUser, IconGitHub } from '@/components/ui/icons'
import { ChatMessageActions } from '@/components/chat-message-actions'
import { ChatMessage, ChatMessageContent } from 'vellum-ai/api'

export interface ChatMessageProps {
  message: ChatMessage
}

const serializeChatMessageContent = (content?: ChatMessageContent): string => {
  if (!content) return ''
  switch (content.type) {
    case 'STRING':
      return content.value
    case 'ARRAY':
      return content.value
        .map(sub => serializeChatMessageContent(sub))
        .join('\n\n')
    case 'FUNCTION_CALL':
      return `_Calling function \`${content.value.name}\`..._`
    default:
      return `\`\`\`
${JSON.stringify(content.value)}
\`\`\``
  }
}

const serializeFunctionContent = (content?: ChatMessageContent): string => {
  if (content?.type !== 'STRING') return '';
  try {
    const parsed = JSON.parse(content.value)
    if (parsed.error) {
      return `Error (${parsed.status}): ${parsed.message}`
    }
    return `\`\`\`json
${JSON.stringify(parsed, null, 2)}
\`\`\``;
  } catch (e) {
    return `\`\`\`json
${content.value}
\`\`\``;
  }
}

export function ChatMessageComponent({ message, ...props }: ChatMessageProps) {
  return (
    <div
      className={cn('group relative mb-4 flex items-start md:-ml-12')}
      {...props}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
          message.role === 'USER'
            ? 'bg-background'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {message.role === 'USER' ? (
          <IconUser />
        ) : message.role === 'FUNCTION' ? (
          <IconGitHub />
        ) : (
          <IconVellum />
        )}
      </div>
      <div className="flex-1 px-1 ml-4 space-y-2 overflow-hidden">
        <MemoizedReactMarkdown
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            code({ node, inline, className, children, ...props }) {
              if (children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 cursor-default animate-pulse">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            }
          }}
        >
          {message.role === 'FUNCTION'
            ? serializeFunctionContent(message.content)
            : serializeChatMessageContent(message.content)}
        </MemoizedReactMarkdown>
        <ChatMessageActions message={message} />
      </div>
    </div>
  )
}
