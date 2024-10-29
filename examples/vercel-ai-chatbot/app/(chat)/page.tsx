import { Chat } from '@/components/chat'
import { cache } from 'react'
import { getDeployments } from '@/app/actions'
const loadDeployments = cache(async () => {
  return await getDeployments()
})
export default async function IndexPage() {
  const deployments = await loadDeployments()

  return (
    <Chat
      deployments={deployments}
      defaultWorkflowDeploymentId={deployments[0].id}
    />
  )
}
