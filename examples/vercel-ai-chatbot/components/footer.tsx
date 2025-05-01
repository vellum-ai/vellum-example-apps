import React from 'react'

import { cn } from '@/lib/utils'
import Link from 'next/link'

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
      <Link href="/learn-more" className="underline hover:no-underline">
        here
      </Link>{' '}
      to learn more.
    </p>
  )
}
