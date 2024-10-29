<a href="https://chatbot.demo.vellum.ai">
  <img alt="Vellum AI Chatbot on Next.js" src="https://chatbot.demo.vellum.ai/opengraph-image.png">
  <h1 align="center">Vellum AI Chatbot on Next.js</h1>
</a>

<p align="center">
  An open-source AI chatbot app template built with Vellum, Next.js, and deployed on Vercel. Cloned from https://github.com/vercel/ai-chatbot.git, adapted to support Vellum prompts and workflows.
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

Check out our onboarding video below for a step-by-step guide for how to set up your own Vellum-powered chatbot!

[![Watch the video](https://cdn.loom.com/sessions/thumbnails/ae4d43f775754ebbbcead815fea2b064.png)](https://www.loom.com/share/ae4d43f775754ebbbcead815fea2b064)

The step-by-step guide is additionally outlined below.

### Setup your Workflow on Vellum

Navigate to the [Vellum Workflows](https://app.vellum.ai/workflow-sandboxes) tab to get started on creating your own workflow. Be sure to deploy the workflow once you have something you're ready to share. The workflow should have an input variable of type `CHAT_HISTORY` in order to appear as a chatbot option. The workflow should also have at least one output variable of type `STRING`.

Then, navigate to the [API Keys](https://app.vellum.ai/api-keys) tab and generate your own Vellum API Key at the bottom of the page.

### Setup Github Apps for Authentication

Navigate to the [OAuth Apps](https://github.com/settings/developers) tab in your GitHub developer settings to create an OAuth App. This demo uses GitHub authentication to authenticate users to the chatbot so that users could save historical conversations. Create one for dev and have the callback URL pointed to `http://localhost:3000/api/auth/callback/github`. Copy the client id and client secret that are generated.

### Deploy to Vercel

You can deploy your own version of the Vellum AI Chatbot to Vercel by clicking the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvellum-ai%2Fvellum-example-apps%2Ftree%2Fmain%2Fexamples%2Fvercel-ai-chatbot&env=VELLUM_API_KEY,AUTH_GITHUB_ID,AUTH_GITHUB_SECRET,AUTH_SECRET&envDescription=For%20more%20on%20how%20to%20set%20these%20environment%20variables%2C%20follow%20the%20link%20below&envLink=https%3A%2F%2Fgithub.com%2Fvellum-ai%2Fvellum-example-apps%2Fblob%2Fmain%2Fexamples%2Fvercel-ai-chatbot%2F.env.example&project-name=vellum-ai-chatbot&repository-name=vellum-ai-chatbot&demo-title=Vellum%20AI%20Chatbot%20on%20Next.js&demo-description=An%20open-source%20AI%20chatbot%20app%20template%20built%20with%20Vellum%2C%20Next.js%2C%20the%20Vercel%20AI%20SDK%2C%20and%20Vercel%20KV.&demo-url=https%3A%2F%2Fvellum-example-apps-six.vercel.app)

### Creating a KV Database Instance

Follow the steps outlined in the [quick start guide](https://vercel.com/docs/storage/vercel-kv/quickstart#create-a-kv-database) provided by Vercel. This guide will assist you in creating and configuring your KV database instance on Vercel, enabling your application to interact with it.

Remember to update your environment variables (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`) in the `.env` file with the appropriate credentials provided during the KV database setup.

### Adding your Workflow

Navigate to `/app/api/chat/route.ts` and edit the name of the workflow to point to the name you have deployed in Vellum.

### Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various Vellum and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/). Try typing in a message!

### Push to production

Commit your changes and push back up to main. Vercel should automatically initiate a new deployment upon noticing a new commit on `main`.

Take note of the domain that is hosting your chatbot. Navigate back to GitHub and create a new GitHub app that will be used for production. This time, set the callback url to `[URL FROM VERCEL]/api/auth/callback/github`. As before, save the client id and client secret, but this time set it to the vercel deployment's variables _only_. Redeploy the chatbot to now have a working end-to-end Vellum-backed chatbot in production!

## Authors

This template is maintained by the [Vellum](https://vellum.ai) team. To inquire about using Vellum for your LLM development, reach out for a [demo today](https://www.vellum.ai/landing-pages/request-demo)!
