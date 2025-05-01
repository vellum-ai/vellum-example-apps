import { QRCodeSVG } from 'qrcode.react'

import { auth } from '@/auth'
import { ExternalLink } from '@/components/external-link'
import Link from 'next/link'

export default async function LearnMorePage() {
  const session = await auth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4 h-full pb-20">
      <div className="max-w-2xl w-full p-8 text-center space-y-8 grow">
        <h1 className="text-4xl font-bold tracking-tighter">
          {"Let's Connect!"}
        </h1>

        <p className="text-xl text-muted-foreground">
          Scan the QR code below to get in touch
        </p>

        <div className="flex justify-center p-4 bg-white rounded-lg">
          <QRCodeSVG
            value="https://www.vellum.ai/landing-pages/request-demo"
            size={384}
            level="H"
          />
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-bold px-2">Email us directly at:</span>
            <ExternalLink href="mailto:support@vellum.ai">
              support@vellum.ai
            </ExternalLink>
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-bold px-2">Follow us on LinkedIn:</span>
            <ExternalLink href="https://www.linkedin.com/company/vellumai">
              https://www.linkedin.com/company/vellumai
            </ExternalLink>
          </p>
        </div>
      </div>
      <p
        className={
          'px-2 text-center text-xs leading-normal text-muted-foreground'
        }
      >
        Open source{' '}
        <Link href="/" className="underline hover:no-underline">
          AI chatbot
        </Link>{' '}
        built with{' '}
        <ExternalLink href="https://nextjs.org">Next.js</ExternalLink> and{' '}
        <ExternalLink href="https://vercel.com/storage/kv">
          Vercel KV
        </ExternalLink>
        .
      </p>
    </div>
  )
}
