'use client'

import { Chat } from '@/lib/types'
import { AnimatePresence, motion } from 'framer-motion'

import { SidebarActions } from '@/components/sidebar-actions'
import { SidebarItem } from '@/components/sidebar-item'

interface SidebarItemsProps {
  chats: Chat[]
}

export function SidebarItems({ chats }: SidebarItemsProps) {
  if (!chats.length) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">No chat history</p>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {chats.map((chat, index) => (
        <motion.div
          key={chat.id}
          exit={{
            opacity: 0,
            height: 0
          }}
        >
          <SidebarItem index={index} chat={chat}>
            <SidebarActions chat={chat} />
          </SidebarItem>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
