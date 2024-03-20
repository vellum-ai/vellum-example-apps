import { ExternalLink } from '@/components/external-link'

export function EmptyScreen() {
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
          You can start a conversation by entering a message below. The chatbot
          is configured to answer questions about the weather and will ignore
          other inquiries.
        </p>
      </div>
    </div>
  )
}
