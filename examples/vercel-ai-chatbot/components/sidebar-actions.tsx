'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'react-hot-toast'

import { type Chat } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  IconShare,
  IconSpinner,
  IconTrash,
  IconEdit
} from '@/components/ui/icons'
import { ChatShareDialog } from '@/components/chat-share-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { editChat, removeChat, shareChat } from '@/app/actions'
import { Input } from './ui/input'

interface SidebarActionsProps {
  chat: Chat
}

export function SidebarActions({ chat }: SidebarActionsProps) {
  const router = useRouter()
  const editFormId = React.useId()
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [isEditPending, startEditTransition] = React.useTransition()
  const [isRemovePending, startRemoveTransition] = React.useTransition()

  return (
    <>
      <div className="space-x-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="size-6 p-0 hover:bg-background"
              onClick={() => setEditDialogOpen(true)}
            >
              <IconEdit />
              <span className="sr-only">Edit</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit Title</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="size-6 p-0 hover:bg-background"
              onClick={() => setShareDialogOpen(true)}
            >
              <IconShare />
              <span className="sr-only">Share</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share chat</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="size-6 p-0 hover:bg-background"
              disabled={isRemovePending}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <IconTrash />
              <span className="sr-only">Delete</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete chat</TooltipContent>
        </Tooltip>
      </div>
      <ChatShareDialog
        chat={chat}
        shareChat={shareChat}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        onCopy={() => setShareDialogOpen(false)}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your chat `{chat.title}`.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemovePending}
              onClick={event => {
                event.preventDefault()
                // @ts-ignore
                startRemoveTransition(async () => {
                  const result = await removeChat({
                    id: chat.id
                  })

                  if (result && 'error' in result) {
                    toast.error(result.error)
                    return
                  }

                  setDeleteDialogOpen(false)
                  router.refresh()
                  router.push('/')
                  toast.success('Chat deleted')
                })
              }}
            >
              {isRemovePending && <IconSpinner className="mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Chat</AlertDialogTitle>
          </AlertDialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault()
              startEditTransition(async () => {
                const formData = new FormData(e.target as HTMLFormElement)
                const title = formData.get('title')
                const result = await editChat({
                  id: chat.id,
                  title: title as string
                })

                if (result && 'error' in result) {
                  toast.error(result.error)
                  return
                }

                setEditDialogOpen(false)
                router.refresh()
                toast.success('Chat updated!')
              })
            }}
            id={editFormId}
          >
            <Input
              type="text"
              defaultValue={chat.title}
              name={'title'}
              autoFocus
            />
          </form>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEditPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction disabled={isEditPending} type="submit" form={editFormId}>
              {isEditPending && <IconSpinner className="mr-2 animate-spin" />}
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
