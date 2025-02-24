# Inverview Agent

A fully automated Technical Interview AI Agent built during the ElevenLabs x a16z hackathon.

## Project Overview

Interview Agent conducts technical interviews autonomously, using voice synthesis and AI to evaluate candidates for technical roles. Built in just 20 hours at the ElevenLabs x a16z hackathon.

## Live Demo

**App URL:** [https://inverview-agent.com/](https://inverview-agent.com/)

**Project Presentation:** [https://devpost.com/software/inverview-agent](https://devpost.com/software/inverview-agent)

**Project Source Code:** [https://github.com/goosewin/interview-agent](https://github.com/goosewin/interview-agent)

## Hackathon Reflections

I attended the ElevenLabs x a16z hackathon over the weekend and built this fully automated Technical Interview AI Agent (which I will be employing for my hiring pipeline). Here are my thoughts:

- Agents are ridiculously easy to build now
- Generative coding tools are insanely good (v0, lovable, bolt for UI prototyping get you moving really quickly)
- You can hack almost anything over a weekend
- We will see more bots on social media, phone calls, meetings, etc.
- Voice cloning & synthesis are practically indistinguishable now
- I will be taking a deeper dive into agent orchestration systems - it's incredibly easy to build now

Cranked out ~35k lines of code in 20 hours, with AI generating about 80% of it. Built the whole thing solo. The definition of software development is changing for sure!

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework with TypeScript
- [ElevenLabs](https://elevenlabs.io/) - Voice synthesis and cloning
- [Clerk](https://clerk.com/) - Authentication and user management
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI streaming and integration
- [Mastra AI](https://mastra.ai/) - Agent orchestration and workflows
- [shadcn/ui](https://ui.shadcn.com/) - UI component system
- [Lovable](https://lovable.dev/) - UI prototyping
- [v0](https://v0.dev/) - AI-powered UI generation
- [PostHog](https://posthog.com/) - LLM observability and analytics
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor component
- [Resend](https://resend.com/) - Email delivery
- [Vercel](https://vercel.com/) - Deployment and hosting
