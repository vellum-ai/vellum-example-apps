<a href="https://vellum-example-apps-six.vercel.app">
  <img alt="Vellum AI Chatbot on Next.js" src="https://vellum-example-apps-six.vercel.app/opengraph-image.png">
  <h1 align="center">Vellum AI Chatbot on Next.js</h1>
</a>

<p align="center">
  An open-source AI chatbot app template built with Vellum, Next.js, the Vercel AI SDK, and Vercel KV. Cloned from https://github.com/vercel/ai-chatbot.git, adapted to support Vellum prompts and workflows.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a> ·
  <a href="#authors"><strong>Authors</strong></a>
</p>
<br/>

## Features

- Support for all major Model Providers, powered by [Vellum](https://vellum.ai)
- [Next.js](https://nextjs.org) App Router
- React Server Components (RSCs), Suspense, and Server Actions
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - [Radix UI](https://radix-ui.com) for headless component primitives
  - Icons from [Phosphor Icons](https://phosphoricons.com)
- [NextAuth.js](https://github.com/nextauthjs/next-auth) for authentication
- Chat History, rate limiting, and session storage with [Vercel KV](https://vercel.com/storage/kv)

## Deploy Your Own

You can deploy your own version of the Vellum NextJS AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvellum-ai%2Fvellum-example-apps%2Ftree%2Fmain%2Fexamples%2Fvercel-ai-chatbot&env=OPENAI_API_KEY,AUTH_GITHUB_ID,AUTH_GITHUB_SECRET,AUTH_SECRET&envDescription=For%20more%20on%20how%20to%20set%20these%20environment%20variables%2C%20follow%20the%20link%20below&envLink=https%3A%2F%2Fgithub.com%2Fvellum-ai%2Fvellum-example-apps%2Fblob%2Fmain%2Fexamples%2Fvercel-ai-chatbot%2F.env.example&project-name=vellum-ai-chatbot&repository-name=vellum-ai-chatbot&demo-title=Vellum%20AI%20Chatbot%20on%20Next.js&demo-description=An%20open-source%20AI%20chatbot%20app%20template%20built%20with%20Vellum%2C%20Next.js%2C%20the%20Vercel%20AI%20SDK%2C%20and%20Vercel%20KV.&demo-url=https%3A%2F%2Fvellum-example-apps-six.vercel.app)

### Creating a KV Database Instance

Follow the steps outlined in the [quick start guide](https://vercel.com/docs/storage/vercel-kv/quickstart#create-a-kv-database) provided by Vercel. This guide will assist you in creating and configuring your KV database instance on Vercel, enabling your application to interact with it.

Remember to update your environment variables (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`) in the `.env` file with the appropriate credentials provided during the KV database setup.

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various Vellum and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

## Authors

This library is created by [Vercel](https://vercel.com) and [Next.js](https://nextjs.org) team members, with contributions from:

- Jared Palmer ([@jaredpalmer](https://twitter.com/jaredpalmer)) - [Vercel](https://vercel.com)
- Shu Ding ([@shuding\_](https://twitter.com/shuding_)) - [Vercel](https://vercel.com)
- shadcn ([@shadcn](https://twitter.com/shadcn)) - [Vercel](https://vercel.com)
- Vellum - [Vellum](https://vellum.ai)
