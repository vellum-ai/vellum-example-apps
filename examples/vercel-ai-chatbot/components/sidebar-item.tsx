'use client'

import * as React from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { motion } from 'framer-motion'

import { buttonVariants } from '@/components/ui/button'
import { IconMessage, IconUsers } from '@/components/ui/icons'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { type Chat } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  index: number
  chat: Chat
  children: React.ReactNode
}

export function SidebarItem({ index, chat, children }: SidebarItemProps) {
  // Next.js usePathname was throwing a null pointer error trying to access the context.
  // Similar to https://github.com/vercel/next.js/issues/49355
  const [isActive, setIsActive] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.pathname.includes(chat.id)) setIsActive(true)
  }, [chat.id])

  if (!chat.id) return null

  return (
    <motion.div
      className="group relative h-8"
      variants={{
        initial: {
          height: 0,
          opacity: 0
        },
        animate: {
          height: 'auto',
          opacity: 1
        }
      }}
      transition={{
        duration: 0.25,
        ease: 'easeIn'
      }}
    >
      <div className="absolute left-2 top-1 flex size-6 items-center justify-center">
        <IconMessage className="mr-2" />
      </div>
      <Link
        href={`/chat/${chat.id}`}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'group w-full px-8 transition-colors hover:bg-zinc-200/40 dark:hover:bg-zinc-300/10',
          isActive && 'bg-zinc-200 pr-16 font-semibold dark:bg-zinc-800'
        )}
      >
        <div
          className="relative max-h-5 flex-1 select-none overflow-hidden text-ellipsis break-all"
          title={chat.title}
        >
          <span className="truncate max-w-32">
            <span>{chat.title}</span>
          </span>
        </div>
      </Link>
      <div
        className={'absolute right-2 top-1 group-hover:opacity-100 opacity-0'}
      >
        {children}
      </div>
    </motion.div>
  )
}
