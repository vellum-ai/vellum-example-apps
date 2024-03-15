'use client'

import { Button } from '@/components/ui/button'
import { IconCheck, IconCopy, IconRefresh } from '@/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { ChatMessage } from 'vellum-ai/api'

interface ChatMessageActionsProps extends React.ComponentProps<'div'> {
  message: ChatMessage
  reload?: () => Promise<void>
}

export function ChatMessageActions({
  message,
  className,
  reload,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  const onCopy = () => {
    if (isCopied || message.content?.type !== 'STRING') return
    copyToClipboard(message.content?.value)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-end transition-opacity group-hover:opacity-100 md:absolute md:-right-10 md:-top-2 md:opacity-0',
        className
      )}
      {...props}
    >
      {reload && (
        <Button variant="ghost" size="icon" onClick={reload}>
          <IconRefresh />
          <span className="sr-only">Reload message</span>
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={onCopy}>
        {isCopied ? <IconCheck /> : <IconCopy />}
        <span className="sr-only">Copy message</span>
      </Button>
    </div>
  )
}
