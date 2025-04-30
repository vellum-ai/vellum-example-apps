'use client'

import { useCallback, useState } from 'react'
import { Label } from '@/components/ui/label'
import { SlimWorkflowDeployment } from 'vellum-ai/api/types/SlimWorkflowDeployment'

interface EmptyDeploymentSelectorProps {
  deployments: SlimWorkflowDeployment[]
  onDeploymentIdChange: (id: string) => void
}

export function EmptyDeploymentSelector({
  deployments,
  onDeploymentIdChange
}: EmptyDeploymentSelectorProps) {
  return (
    <div className="mt-6 grid grid-cols-3 gap-4">
      {deployments.map(deployment => (
        <div
          key={deployment.id}
          className={`flex items-start space-x-3 rounded-md p-2 border-2 cursor-pointer border-gray-200 hover:bg-slate-100 hover:shadow-lg`}
          onClick={() => onDeploymentIdChange(deployment.id)}
        >
          <Label htmlFor={deployment.id} className="font-medium cursor-pointer">
            {deployment.label}
          </Label>
        </div>
      ))}
    </div>
  )
}
