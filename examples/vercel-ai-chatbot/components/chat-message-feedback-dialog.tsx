'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { IconVellum, IconArrowDown } from '@/components/ui/icons'
import { ChatMessage } from 'vellum-ai/api'
import { useCallback, useState } from 'react'
import { toast } from 'react-hot-toast'

interface ChatMessageFeedbackDialogProps {
  message: ChatMessage
}

export function ChatMessageFeedbackDialog({
  message
}: ChatMessageFeedbackDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const submitFeedback = useCallback(
    async (quality: number) => {
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
      if (response.ok) {
        setIsOpen(false)
      } else {
        toast.error(await response.text())
      }
    },
    [message.source]
  )
  const approve = useCallback(() => submitFeedback(1), [submitFeedback])
  const reject = useCallback(() => submitFeedback(0), [submitFeedback])

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <IconVellum className="cursor-pointer" />
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat Message Feedback</DialogTitle>
            <DialogDescription>
              <div className="mb-4">Did you find this message helpful?</div>
              <div className="flex gap-4">
                <Button onClick={approve} style={{ background: 'darkgreen' }}>
                  <IconArrowDown className="rotate-180" />
                </Button>
                <Button onClick={reject} style={{ background: 'darkred' }}>
                  <IconArrowDown />
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
