'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { IconVellum, IconArrowDown } from '@/components/ui/icons'
import { ChatMessage } from 'vellum-ai/api'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { ExternalLink } from './external-link'
import { WORKFLOW_DEPLOYMENT_ID } from '@/lib/constants'

interface ChatMessageFeedbackDialogProps {
  message: ChatMessage
}

export function ChatMessageFeedbackDialog({
  message
}: ChatMessageFeedbackDialogProps) {
  const href = useMemo(
    () =>
      `https://app.vellum.ai/deployments/workflows/${WORKFLOW_DEPLOYMENT_ID}/executions/${message.source}`,
    [message.source]
  )
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const submitFeedback = useCallback(
    async (quality: number) => {
      setLoading(true)
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: message.source,
          quality
        })
      })
      setLoading(false)
      if (response.ok) {
        setIsOpen(false)
        toast.success('Feedback submitted!', {
          icon: <ExternalLink href={href}>Visit</ExternalLink>
        })
      } else {
        toast.error(await response.text())
      }
    },
    [href, message.source]
  )
  const approve = useCallback(() => submitFeedback(1), [submitFeedback])
  const reject = useCallback(() => submitFeedback(0), [submitFeedback])

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
              onClick={approve}
              style={{ background: 'darkgreen' }}
              disabled={loading}
            >
              <IconArrowDown className="rotate-180" />
            </Button>
            <Button
              onClick={reject}
              style={{ background: 'darkred' }}
              disabled={loading}
            >
              <IconArrowDown />
            </Button>
          </div>
          <div>
            <ExternalLink href={href}>See Execution on Vellum</ExternalLink>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
