'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { SlimWorkflowDeployment } from 'vellum-ai/api/types/SlimWorkflowDeployment'

interface EmptyDeploymentSelectorProps {
  deployments: SlimWorkflowDeployment[]
  onDeploymentIdChange: (id: string) => void
}

export function EmptyDeploymentSelector({
  deployments,
  onDeploymentIdChange
}: EmptyDeploymentSelectorProps) {
  const [selectedDeployment, setSelectedDeployment] = useState<string>(
    deployments[0]?.id || ''
  )
  useEffect(() => {
    onDeploymentIdChange(selectedDeployment)
  }, [onDeploymentIdChange, selectedDeployment])

  return (
    <div className="mt-6 grid grid-cols-3 gap-4">
      {deployments.map(deployment => (
        <div
          key={deployment.id}
          className={`flex items-start space-x-3 rounded-md p-2 border-2 border-primary cursor-pointer ${
            selectedDeployment === deployment.id
              ? 'border-sky-600'
              : 'border-gray-200'
          }`}
          onClick={() => setSelectedDeployment(deployment.id)}
        >
          <Label htmlFor={deployment.id} className="font-medium">
            {deployment.label}
          </Label>
          {deployment.description && (
            <p className="text-sm text-muted-foreground">
              {deployment.description}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
