<div align="center">
 <br />
  <br />

<picture>
    <source media="(prefers-color-scheme: dark)" width="700" srcset="https://github.com/user-attachments/assets/09cf4bfb-36a5-4eda-a892-4ba737d6a531" />
    <source media="(prefers-color-scheme: light)" width="700" srcset="https://github.com/user-attachments/assets/7ccbabbf-5ddd-4cf0-9e44-cfbc5ba72e06" />
    <img alt="Logo" width="700" src="https://github.com/user-attachments/assets/09cf4bfb-36a5-4eda-a892-4ba737d6a531" />
</picture>

<br />
<br />
<br />

![](https://img.shields.io/badge/Bun-000000?style=flat-square&logo=bun&logoColor=white)
![](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![](https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![](https://img.shields.io/badge/AI-FF6B6B?style=flat-square&logo=openai&logoColor=white)

![GitHub license](https://img.shields.io/github/license/turbostarter/extro)
<a href="https://discord.gg/KjpK2uk3JP" target="_blank"><img src="https://discord.com/api/guilds/1280456871693779006/widget.png"/></a>

<!-- Product Hunt Launch Placeholder -->
<a href="https://www.producthunt.com/posts/focus-ai-extension?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-focus-ai" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=000&theme=light" alt="Focus AI Extension - AI-powered distraction blocking that understands your work | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

<!-- Kickstarter Campaign Placeholder -->
<a href="https://www.kickstarter.com/projects/focusai/focus-ai-extension" target="_blank"><img src="https://ksr-ugc.imgix.net/assets/038/123/456/7890abc1234567890abcdef123456789-original.png?ixlib=rb-4.0.2&w=80&h=80&fit=crop&v=1664380163&auto=format&frame=1&q=92&s=1234567890abcdef" alt="Back us on Kickstarter" style="width: 80px; height: 80px;" width="80" height="80" /></a>

</div>

# AI-Powered Focus Extension

An intelligent browser extension that uses AI to help you stay focused by understanding the context of your work and making smart decisions about what content is relevant to your current task.

> Unlike traditional focus apps that rely on static blocklists, this extension analyzes content in real-time and can even negotiate with you when you need access to distracting sites.
>
> **Free and Open Source** - Simply add your own OpenAI or Google Gemini API key to get started!

## ✨ What Makes It Special

### 💰 Free & Open Source
- **No Subscription Fees**: Completely free to use with your own API key
- **Privacy Focused**: Your data stays private, only API calls are made to your chosen AI provider
- **Transparent**: Open source code you can inspect and modify

### 🤖 AI-Powered Content Analysis
- **Context-Aware Blocking**: Analyzes actual content rather than just blocking domains
- **Intelligent Element Removal**: Selectively removes distractions while preserving useful content

### 💬 Conversational Access Control
- **Chat-Based Negotiation**: When content is blocked, chat with an AI assistant to request temporary access
- **Contextual Decisions**: AI evaluates requests based on your current task
- **Educational Feedback**: Learn why content was blocked and understand your distraction patterns

### 🎯 Task-Driven Filtering
- **Dynamic Adaptation**: Blocking decisions adapt based on your stated goals
- **Flexible Blocking Levels**: Supports full page blocking or selective element removal
- **Automatic Re-blocking**: Time-limited access with automatic re-blocking when timer expires

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) package manager
- API key for OpenAI or Google Gemini

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd focus-app
```

2. Install dependencies
```bash
bun install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Start development server
```bash
# For Chrome
bun dev:chrome

# For Firefox
bun dev:firefox
```

5. Load extension in browser:
   - **Chrome**: Go to `chrome://extensions`, enable Developer mode, click "Load unpacked", select `build/chrome-mv3`
   - **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", select `build/firefox-mv2/manifest.json`

## 📖 Usage

1. **Set API Key**: In extension options, add your OpenAI or Google Gemini API key
2. **Define Your Task**: In the popup, describe what you're working on
3. **Stay Focused**: The AI will analyze content and block distractions intelligently
4. **Chat for Access**: When blocked, explain why you need access to negotiate temporary access

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Popup UI      │    │   Options Page  │    │   Side Panel    │
│                 │    │                 │    │                 │
│ - Quick toggle  │    │ - API keys      │    │ - Persistent    │
│ - Task input    │    │ - Provider      │    │   interface     │
│ - Status view   │    │   settings      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────┼─────────────────────────┐
         │                      │                      │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Background     │    │ Content Script │    │   Tabs Page     │
│ Service       │    │                 │    │                 │
│ Worker        │    │ - Page analysis│    │ - Settings      │
│               │    │ - UI overlay   │    │ - Full page     │
│ - AI analysis │    │ - Chat UI      │    │   interface     │
│ - Cache mgmt  │    │ - Element      │    │                 │
│ - Storage     │    │   removal      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

| Tech | Description |
| ---- | ----------- |
| [TypeScript](https://www.typescriptlang.org/) | Static type-checking |
| [React](https://reactjs.org/) | UI library |
| [WXT](https://wxt.dev/) | Web Extension Framework |
| [Tailwind CSS](https://tailwindcss.com/) | Styling framework |
| [AI SDK](https://sdk.vercel.ai/) | AI integration |
| [Bun](https://bun.sh/) | Package manager & runtime |

## 🤝 Contributing

We welcome contributions of any kind! Here's how to get started:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `bun test`
5. Check code style: `bun lint`
6. Commit your changes: `git commit -m 'feat: add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

- Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- Use Biome for formatting (configured in `biome.json`)
- 2-space indentation, double quotes, trailing commas
- Functional React components with Hooks
- TypeScript strict mode with no implicit `any`

### Project Structure

```
src/
├── app/          # Entry points for extension parts
├── components/   # Shared React components
├── lib/         # Core functionality (AI, cache, storage)
├── assets/      # Static assets
└── types/       # TypeScript type definitions
```

### Testing

- Use Bun test framework
- Place tests in `src/lib/tests/`
- Run with: `bun test`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆚 Comparison with Traditional Focus Apps

| Feature | Traditional Apps | This AI-Powered App |
|---------|------------------|---------------------|
| **Blocking Method** | Static blocklists | AI content analysis |
| **Context Awareness** | None | Understands task relevance |
| **Flexibility** | Rigid rules | Selective element removal |
| **Access Control** | Manual overrides | Conversational negotiation |
| **Authentication** | Often blocks auth | Smart auth detection |
| **Adaptation** | Manual updates | Automatic adaptation |
| **User Experience** | Disruptive | Educational feedback |

## 🔮 Future Enhancements

- Multi-task support
- Usage analytics
- Team collaboration
- Advanced scheduling
- Project management integrations

## 🚀 Support Our Project

- **Product Hunt**: Follow our launch and show your support with an upvote
- **Kickstarter**: Back our campaign to help fund advanced features
- **GitHub**: Star the repository and contribute to the codebase

---