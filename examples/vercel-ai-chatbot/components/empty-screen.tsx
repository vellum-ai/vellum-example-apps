import { ExternalLink } from '@/components/external-link'
import { EmptyDeploymentSelector } from './empty-deployment-selector'
import { SlimWorkflowDeployment } from 'vellum-ai/api/types/SlimWorkflowDeployment'
import useLocalStorage from 'use-local-storage'
import { useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'

interface EmptyScreenProps {
  deployments?: SlimWorkflowDeployment[]
  onDeploymentIdChange: (id: string) => void
}

export function EmptyScreen({
  deployments,
  onDeploymentIdChange: onDeploymentIdChangeProp
}: EmptyScreenProps) {
  const [selectedDeploymentId, setSelectedDeploymentId] = useLocalStorage(
    'selectedDeploymentId',
    ''
  )
  const selectedDeployment = useMemo(() => {
    return deployments?.find(
      deployment => deployment.id === selectedDeploymentId
    )
  }, [deployments, selectedDeploymentId])

  const onDeploymentIdChange = useCallback(
    (id: string) => {
      setSelectedDeploymentId(id)
      onDeploymentIdChangeProp(id)
    },
    [onDeploymentIdChangeProp, setSelectedDeploymentId]
  )
  return (
    <div className="mx-auto max-w-2xl px-4 h-full">
      <div className="rounded-lg border bg-background p-8 h-full">
        {selectedDeployment ? (
          <div className="mt-4 flex flex-col gap-4 h-full">
            <h1 className="text-lg font-semibold">
              Welcome to {selectedDeployment.label}
            </h1>
            <p className="leading-normal text-muted-foreground">
              {selectedDeployment.description}
            </p>
            <p className="leading-normal text-muted-foreground grow">
              You can start a conversation with the chatbot by entering a
              message below.
            </p>
            <Button
              onClick={() => onDeploymentIdChange('')}
              className="align-middle self-end"
            >
              Back
            </Button>
          </div>
        ) : deployments ? (
          <>
            <h1 className="mb-2 text-lg font-semibold">
              Welcome to the Vellum AI Chatbot!
            </h1>
            <p className="mb-2 leading-normal text-muted-foreground">
              This is an open source AI chatbot app template built with{' '}
              <ExternalLink href="https://vellum.ai">Vellum</ExternalLink> and{' '}
              <ExternalLink href="https://nextjs.org">Next.js</ExternalLink>
            </p>
            <p className="leading-normal text-muted-foreground">
              You can start a conversation with the selected chatbot by entering
              a message below.
            </p>
            <EmptyDeploymentSelector
              deployments={deployments}
              onDeploymentIdChange={onDeploymentIdChange}
            />
          </>
        ) : (
          <div>
            <p>No deployments available</p>
          </div>
        )}
      </div>
    </div>
  )
}
