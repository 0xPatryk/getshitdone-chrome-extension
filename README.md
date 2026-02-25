# GetShitDone — An AI Bodyguard for Your Brain

## My Story: Built for Focus, Not Willpower

I have strong willpower. I get shit done. But even the most disciplined among us have those days where you sit down to ship a feature, blink, and somehow you're 12 tabs deep comparing JavaScript frameworks your app definitely doesn't need yet.

**You know the drill:**

You're building something. You need to check a quick docs reference. Next thing you know, you're reading about some new AI model, then a database optimization technique (for your 0-user app), then suddenly it's 3 PM and you've written 5 lines of actual code.

It's not a lack of discipline. It's that **modern work requires using the same tools that are designed to distract us.** You need Twitter for market research, YouTube for tutorials, Reddit for debugging. Traditional blockers are too blunt — they ban the tools you actually need.

And the worst part? The distractions don't look like distractions. They look like *learning*. Like *research*. Like *staying current*. You tell yourself you're being productive while your actual project sits untouched.

**I built this because I was tired of my own brain's excuses.**

This extension doesn't replace your willpower — it **removes the need to use it** on every single click. You decide your goal once. The AI enforces it. You save your decision-making energy for the actual work.

---

## What Is GetShitDone?

GetShitDone is an AI-powered browser extension that acts as a **context-aware gatekeeper** for your attention. Unlike dumb blockers that ban entire sites, it **reads and understands** what you're looking at, compares it to your stated goal, and makes intelligent decisions about whether it belongs in your brain right now.

### The "Fake Productivity" Problem

The most insidious distractions aren't cat videos — they're **work-adjacent content that tricks your brain**:

| What You Tell Yourself | What Actually Happens |
|------------------------|----------------------|
| "I'm researching competitors on Twitter" | 2 hours of political rabbit holes |
| "I'm learning about database optimization" | Avoiding the actual feature you need to build |
| "I'm staying current on AI trends" | Reading the 47th article about the same LLM release |
| "I'm finding inspiration on Dribbble" | 3 hours of scrolling, zero designs started |

GetShitDone catches these. It knows the difference between "watching a Rust tutorial because you're building a Rust project" and "watching a Rust tutorial to avoid working on your JavaScript project."

---

## How It Works (3 Steps)

### 1. Tell It Your Mission

Open the popup and describe what you're actually trying to accomplish:

> *"Building a React component for user authentication"*
>
> *"Writing a Rust CLI tool that processes CSV files"*
>
> *"Researching competitor pricing for my SaaS"*

The AI uses this as its north star for every decision.

### 2. Set Your "Always Remove" List

Some things are never relevant. Tell it once, it removes them everywhere:

> *"YouTube recommendations, Instagram reels, Twitter trending, news sidebars"*

THIS FEATURE BURNS A LOT OF TOKENS!

The AI extracts CSS selectors automatically. No technical knowledge needed.

### 3. Browse Normally (The AI Handles the Rest)

Every page you visit gets analyzed in real-time:

- **Relevant content?** → Full access, distracting elements removed
- **Irrelevant but work-adjacent?** → Blocked with explanation
- **Obvious time-waster?** → Blocked immediately
- **Need it anyway?** → Chat with the AI to negotiate temporary access

---

## Key Features

### 🤖 AI-Powered Content Analysis

Uses Google Gemini or OpenAI to actually **read and understand** page content:

- Analyzes the actual text, not just the URL
- Detects "fake productivity" that looks like work but isn't
- Understands context (a Rust tutorial is relevant when you're learning Rust, distracting when you're writing Python)
- Extracts specific CSS selectors to surgically remove distractions while keeping useful content

### 💬 Conversational Access Control

When something gets blocked, you don't just hit a wall — you talk to an AI Focus Coach:

**You**: "I need to access this Twitter thread for market research"

**AI**: "I see you're working on 'Building a React auth component.' This thread appears to be about startup funding. Is this directly relevant to your authentication work, or is this a general research task that could be scheduled separately?"

**You**: "It's about auth best practices from a security researcher"

**AI**: "Granted — 15 minutes of access. I'll remind you when time's up."

No more all-or-nothing blocking. **Negotiate like an adult with your own brain.**

### 🎯 Task-Driven Intelligence

The AI adapts to your current goal:

- **Task**: "Learning Python" → Python tutorials allowed, JavaScript framework announcements blocked
- **Task**: "Debugging production issue" → Stack Overflow, GitHub issues, docs allowed, everything else scrutinized
- **Task**: "Writing blog post" → Research allowed, but Twitter "research" gets flagged

Change your task → Cache invalidates → New rules apply immediately

### 🧠 Caching for Speed & Cost

- Smart caching reduces API calls (saves you money)
- Cache invalidates automatically when you change tasks
- No lag — decisions happen in milliseconds for cached content

### 🔒 Privacy First

- Your API keys stay in your browser (local storage only)
- No data sent to any third party except your chosen AI provider
- No tracking, no analytics, no "phone home"
- Open source — verify the code yourself

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed
- API key from [Google AI Studio](https://aistudio.google.com/app/apikey) (free tier available) or [OpenAI](https://platform.openai.com/api-keys)

### Installation

```bash
# Clone the repository
git clone https://github.com/0xPatryk/getshitdone-extension.git
cd getshitdone-extension

# Install dependencies
bun install

# Copy and configure environment
cp .env.example .env
# Edit .env with your API key

# Start development
bun dev:chrome    # or bun dev:firefox
```

The extension auto-loads in your browser. No manual installation needed during development.

### Production Build

```bash
bun build:chrome   # Creates build/chrome-mv3/
bun build:firefox  # Creates build/firefox-mv2/
```

Then load the unpacked extension from the build directory.

---

## Configuration

### Environment Variables (Development)

Speed up your workflow by pre-configuring settings:

```bash
# .env
VITE_AI_PROVIDER="gemini"                    # or "openai"
VITE_GEMINI_API_KEY="your-key-here"
VITE_CURRENT_TASK="Building a Chrome extension"
VITE_EXTENSION_ENABLED="true"
VITE_ALWAYS_REMOVE="YouTube recommendations, Twitter trending"
```

These auto-load every time you restart development — no clicking through settings.

### Runtime Settings

- **Popup** (toolbar icon): Quick task entry, toggle on/off, always-remove settings
- **Options Page**: API key configuration
- **Full Settings Page**: Complete configuration interface

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Popup UI      │     │  Content Script │     │  Background     │
│                 │     │                 │     │  Service Worker │
│ - Task input    │◄───►│ - Page analysis │◄───►│                 │
│ - Quick toggle  │     │ - Chat overlay  │     │ - AI analysis   │
│ - Status view   │     │ - Element removal│    │ - Grant mgmt    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         └───────────────────┬───────────────────────────┘
                             │
                    ┌─────────────────┐
                    │   AI Provider   │
                    │ (Gemini/OpenAI) │
                    └─────────────────┘
```

**Tech Stack**: TypeScript, React 19, WXT (Web Extension Framework), Tailwind CSS, Vercel AI SDK, Bun

---

## Why This Works

### 1. Removes Decision Fatigue

Your brain doesn't have to decide "is this worth my time?" on every link. The AI decides. You just react to its decision. Save your mental energy for the actual work.

### 2. Catches "Fake Productivity"

Traditional blockers miss the sneaky stuff — the tutorials, the "research," the "staying current" that feels like work but isn't moving your project forward. GetShitDone sees through it.

### 3. Smart, Not Blunt

You *need* Twitter for market research, YouTube for tutorials, Reddit for debugging. This doesn't ban tools — it judges content based on your current goal.

### 4. Time-Boxed Exceptions

Need to check something off-task? Fine. But it's 15 minutes, not "until you accidentally spend 2 hours."

### 5. Systems > Willpower

Willpower is a finite resource. This extension is a **system that works while you work**, so you don't have to constantly police yourself.

---

## Comparison

| Feature | Traditional Blockers | GetShitDone |
|---------|---------------------|-------------|
| **Blocking Method** | Domain-based lists | AI content analysis |
| **Context Awareness** | None | Full task context |
| **Fake Productivity** | Misses it completely | Specifically targets it |
| **Flexibility** | All-or-nothing | Negotiable access |
| **Element Removal** | None | Surgical CSS extraction |
| **Cost** | Often subscription | Free (bring your own API key) |
| **Privacy** | Often tracks you | Fully local, open source |

---

## Contributing

Built by someone who was tired of their own brain's excuses. Contributions welcome from fellow builders who value focus.

```bash
# Fork and clone
git checkout -b feature/your-feature
bun test
bun lint
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

Follow Conventional Commits, use Biome for formatting, write TypeScript with strict mode.

---

## License

MIT — use it, fork it, make it yours.

---

## Final Note

If you're reading this at 11 PM after a day of "research" that produced nothing, **I see you.** This tool won't fix everything, but it might give you back 2-3 hours a day. That's 10-15 hours a week. That's 500+ hours a year.

**Imagine what you could build with 500 extra hours.**

Install it. Try it. Get shit done.

---

*Built with ❤️ and a healthy dose of frustration.*
