import { ExternalLink } from '@/components/external-link'
import { EmptyDeploymentSelector } from './empty-deployment-selector'
import { SlimWorkflowDeployment } from 'vellum-ai/api/types/SlimWorkflowDeployment'

interface EmptyScreenProps {
  deployments?: SlimWorkflowDeployment[]
  onDeploymentIdChange: (id: string) => void
}

export function EmptyScreen({
  deployments,
  onDeploymentIdChange
}: EmptyScreenProps) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to the Vellum AI Chatbot!
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          This is an open source AI chatbot app template built with{' '}
          <ExternalLink href="https://vellum.ai">Vellum</ExternalLink> and{' '}
          <ExternalLink href="https://nextjs.org">Next.js</ExternalLink>
        </p>
        <p className="leading-normal text-muted-foreground">
          You can start a conversation with the selected chatbot by entering a
          message below.
        </p>
        {deployments && (
          <EmptyDeploymentSelector
            deployments={deployments}
            onDeploymentIdChange={onDeploymentIdChange}
          />
        )}
      </div>
    </div>
  )
}
