'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import Textarea from 'react-textarea-autosize'
import { IconVellum, IconArrowDown, IconSpinner } from '@/components/ui/icons'
import { ChatMessage } from 'vellum-ai/api'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { ExternalLink } from './external-link'

interface ChatMessageFeedbackDialogProps {
  message: ChatMessage
  workflowDeploymentId: string
}

export function ChatMessageFeedbackDialog({
  message,
  workflowDeploymentId
}: ChatMessageFeedbackDialogProps) {
  const href = useMemo(
    () =>
      `https://app.vellum.ai/deployments/workflows/${workflowDeploymentId}/executions/${message.source}`,
    [message.source, workflowDeploymentId]
  )
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const [quality, setQuality] = React.useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitPending, startSubmitTransition] = React.useTransition()
  const submitFeedback = useCallback(async () => {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messageId: message.source,
        quality,
        comment: inputRef.current?.value
      })
    })
    if (response.ok) {
      setIsOpen(false)
      toast.success('Feedback submitted!', {
        icon: <ExternalLink href={href}>Visit</ExternalLink>
      })
    } else {
      toast.error(await response.text())
    }
  }, [href, message.source, quality])

  return (
    <>
      <span
        onClick={() => setIsOpen(true)}
        className="cursor-pointer items-center justify-center flex size-full"
      >
        <IconVellum />
      </span>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat Message Feedback</DialogTitle>
          </DialogHeader>
          <div className="mb-4">Did you find this message helpful?</div>
          <div className="flex gap-4 mb-4">
            <Button
              onClick={() => {
                setQuality(1)
              }}
              style={{ background: 'darkgreen' }}
              disabled={isSubmitPending}
              className={quality === 1 ? 'border border-sky-500' : ''}
            >
              <IconArrowDown className="rotate-180" />
            </Button>
            <Button
              onClick={() => {
                setQuality(0)
              }}
              style={{ background: 'darkred' }}
              disabled={isSubmitPending}
              className={quality === 0 ? 'border border-sky-500' : ''}
            >
              <IconArrowDown />
            </Button>
          </div>
          <div>
            <Textarea
              ref={inputRef}
              tabIndex={0}
              minRows={4}
              disabled={isSubmitPending}
              defaultValue={''}
              placeholder="Add a comment..."
              className="w-full resize-none p-2 rounded-md"
            />
          </div>
          <div>
            <ExternalLink href={href}>See Execution on Vellum</ExternalLink>
          </div>
          <DialogFooter className="items-center">
            <Button
              disabled={isSubmitPending}
              onClick={() => {
                startSubmitTransition(submitFeedback)
              }}
            >
              {isSubmitPending ? (
                <>
                  <IconSpinner className="mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>Submit Feedback</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
