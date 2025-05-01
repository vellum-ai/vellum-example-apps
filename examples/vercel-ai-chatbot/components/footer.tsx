import React from 'react'

import { cn } from '@/lib/utils'
import { ExternalLink } from './external-link'

export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'px-2 text-center text-xs leading-normal text-muted-foreground',
        className
      )}
      {...props}
    >
      Click{' '}
      <ExternalLink href="https://www.vellum.ai/learn-more">here</ExternalLink>{' '}
      to learn more.
    </p>
  )
}
