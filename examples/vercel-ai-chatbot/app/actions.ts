'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { type Chat } from '@/lib/types'
import { Vellum, VellumClient } from 'vellum-ai'

export async function getChats(userId: string) {
  try {
    const pipeline = kv.pipeline()
    const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1, {
      rev: true
    })

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec<Chat[]>()

    return results
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function addChat({
  id,
  value,
  workflowDeploymentId
}: {
  id: string
  value: string
  workflowDeploymentId: string
}) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const userMessage = {
    content: {
      type: 'STRING',
      value
    },
    role: 'USER'
  }
  const defaultChatTitle =
    (userMessage?.content?.value as string)?.slice(0, 50) ?? 'New chat'

  await kv.hset(`chat:${id}`, {
    title: defaultChatTitle,
    id,
    createdAt: Date.now(),
    userId: session.user.id,
    messages: [userMessage],
    workflowDeploymentId
  })

  // `score` is used to sort the ids within redis
  // `member` points to what's sorted
  // https://redis.io/commands/zadd
  await kv.zadd(`user:chat:${session.user.id}`, {
    score: Date.now(),
    member: `chat:${id}`
  })

  revalidatePath('/')
  return revalidatePath(`/chat/${id}`)
}

export async function editChat({ id, title }: { id: string; title: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  //Convert uid to string for consistent comparison with session.user.id
  const uid = String(await kv.hget(`chat:${id}`, 'userId'))

  if (uid !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await kv.hset(`chat:${id}`, { title })

  revalidatePath('/')
  return revalidatePath(`/chat/${id}`)
}

export async function removeChat({ id }: { id: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const uid = String(await kv.hget(`chat:${id}`, 'userId'))

  if (uid !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await kv.del(`chat:${id}`)
  await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)

  revalidatePath('/')
  return revalidatePath(`/chat/${id}`)
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chats: string[] = await kv.zrange(`user:chat:${session.user.id}`, 0, -1)
  if (!chats.length) {
    return redirect('/')
  }
  const pipeline = kv.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${session.user.id}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat) {
    return null
  }

  return chat
}

export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || chat.userId !== session.user.id) {
    return {
      error: 'Something went wrong'
    }
  }

  await kv.hset(`chat:${chat.id}`, chat)

  return chat
}

export async function getDeployments() {
  const client = new VellumClient({
    apiKey: process.env.VELLUM_API_KEY ?? ''
  })
  const { results } = await client.workflowDeployments.list()
  if (!results) {
    return []
  }

  // Filter out deployments that don't have a chat history input variable and a single string output variable
  return results.filter(
    deployment =>
      deployment.inputVariables.some(
        variable => variable.type === 'CHAT_HISTORY'
      ) &&
      deployment.outputVariables.filter(variable => variable.type === 'STRING')
        .length >= 1
  )
}
