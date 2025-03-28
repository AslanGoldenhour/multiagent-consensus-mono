# Multiagent Consensus Monorepo

[![Test Coverage](https://img.shields.io/static/v1?label=coverage&message=83.7%25&color=yellow&t=1743192829039)](https://github.com/AslanGoldenhour/multiagent-consensus-mono)
[![Lines of Code](https://img.shields.io/static/v1?label=lines%20of%20code&message=6.2k&color=blue&t=1743192829039)](https://github.com/AslanGoldenhour/multiagent-consensus-mono)
[![Tests](https://img.shields.io/static/v1?label=tests&message=120%20passed&color=brightgreen&t=1743192829039)](https://github.com/AslanGoldenhour/multiagent-consensus-mono)
[![Status](https://img.shields.io/static/v1?label=status&message=active%20development&color=yellow&t=1743192829039)](https://github.com/AslanGoldenhour/multiagent-consensus-mono)

A comprehensive monorepo structure for developing and managing multi-agent consensus systems, with a focus on consensus mechanisms for LLMs.

## 📋 Overview

This monorepo contains packages and applications for building multi-agent systems:

- **packages/multiagent-consensus**: A framework for running consensus processes between multiple LLMs
- **apps/web**: A Next.js web application for visualizing and interacting with multi-agent systems

## 🗂️ Repository Structure

```
/
├── apps/                    # Frontend applications
│   └── web/                 # Next.js web application
├── packages/                # Shared packages
│   └── multiagent-consensus/ # Consensus engine package
├── documentation/           # Project documentation
└── ...                      # Configuration files
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or later)
- npm (v8.0.0 or later)
- Git

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/multiagent-consensus-mono.git
cd multiagent-consensus-mono
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Copy environment files for development
cp .env.development .env
cp .env.local.example .env.local
# Edit .env.local to add your private API keys
```

4. Run the development environment:

```bash
npm run dev
```

### Environment Structure

This project uses a structured approach to environment variables:

- `.env` - Base variables used across all environments (safe to commit)
- `.env.development` - Development-specific variables (safe to commit)
- `.env.production` - Production-specific variables (safe to commit)
- `.env.local` - Private variables like API keys (never commit these)

## 📦 Packages

### multiagent-consensus

A framework for running multi-agent consensus processes using multiple LLMs. Features include:

- Support for multiple consensus methods (majority, supermajority, unanimous)
- Configurable debate rounds
- Detailed metadata and logging
- Support for multiple LLM providers (via Vercel AI SDK)

## 💻 Applications

### Web Dashboard

A Next.js web application for:

- Configuring and running consensus debates
- Visualizing debate results and process
- Managing API keys and providers
- Viewing logs and history

## 📚 Development Guidelines

Please refer to the documentation directory for detailed information on:

- [Project requirements](./documentation/project_requirements_document.md)
- [Implementation plans](./documentation/implementation_plan.md)
- [Code organization](./documentation/folder_structure.md)
- [Testing standards](./documentation/testing_standards.md)
- [Documentation workflows](./documentation/documentation_workflow.md)

## 🧪 Testing

To run tests:

```bash
npm run test
```

## 📊 Code Metrics

- **Total**: 6180 lines

### By Language

| Language | Lines |
| -------- | ----- |
| ts       | 4,468 |
| js       | 1,583 |
| tsx      | 107   |
| css      | 22    |

### By Category

| Category | Lines |
| -------- | ----- |
| core     | 4,323 |
| examples | 1,150 |
| other    | 519   |
| tests    | 141   |
| configs  | 47    |

## 📄 License

MIT

## Environment Variable Configuration

There are two ways to configure API keys for the MultiAgent Consensus package:

### Option 1: Using Environment Variables

The package looks for API keys in environment variables. You can configure these in several ways:

1. Create a `.env` or `.env.local` file in your project root with your API keys:

```
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
MISTRAL_API_KEY=your-mistral-api-key
```

2. Set environment variables in your process environment before running your application.

The package will automatically detect and use these environment variables.

### Option 2: Direct Configuration (Recommended)

For better portability and easier integration with existing applications, you can pass API keys directly in the ConsensusEngine configuration:

```javascript
const engine = new ConsensusEngine({
  models: ['claude-3-5-haiku-20241022', 'gpt-4o'],
  apiKeys: {
    anthropic: 'your-anthropic-api-key',
    openai: 'your-openai-api-key',
  },
  // Other configuration options...
});
```

This approach is especially useful in:

- Containerized environments
- Serverless functions
- Applications that already have a secrets management system
- Testing and development environments

### Provider Key Mapping

The package supports the following provider key mappings:

#### Official Vercel AI SDK Providers

| Provider             | Environment Variable                                       | Config Key      |
| -------------------- | ---------------------------------------------------------- | --------------- |
| OpenAI               | `OPENAI_API_KEY`                                           | `openai`        |
| Anthropic            | `ANTHROPIC_API_KEY`                                        | `anthropic`     |
| Google Generative AI | `GOOGLE_API_KEY`                                           | `google`        |
| Google Vertex AI     | `GOOGLE_APPLICATION_CREDENTIALS`                           | `googleVertex`  |
| Mistral              | `MISTRAL_API_KEY`                                          | `mistral`       |
| Cohere               | `COHERE_API_KEY`                                           | `cohere`        |
| xAI (Grok)           | `XAI_API_KEY`                                              | `xai`           |
| DeepInfra            | `DEEPINFRA_API_KEY`                                        | `deepinfra`     |
| DeepSeek             | `DEEPSEEK_API_KEY`                                         | `deepseek`      |
| Together.ai          | `TOGETHER_API_KEY`                                         | `togetherai`    |
| Fireworks            | `FIREWORKS_API_KEY`                                        | `fireworks`     |
| Groq                 | `GROQ_API_KEY`                                             | `groq`          |
| Perplexity           | `PERPLEXITY_API_KEY`                                       | `perplexity`    |
| Replicate            | `REPLICATE_API_TOKEN`                                      | `replicate`     |
| Amazon Bedrock       | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | `amazonBedrock` |
| Azure OpenAI         | `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`            | `azure`         |
| Cerebras             | `CEREBRAS_API_KEY`                                         | `cerebras`      |
| Luma                 | `LUMA_API_KEY`                                             | `luma`          |

#### Community Providers

| Provider              | Environment Variable                                | Config Key            |
| --------------------- | --------------------------------------------------- | --------------------- |
| Ollama                | `OLLAMA_HOST`                                       | `ollama`              |
| Chrome AI             | `CHROME_API_KEY`                                    | `chromeai`            |
| FriendliAI            | `FRIENDLIAI_API_KEY`                                | `friendliai`          |
| Portkey               | `PORTKEY_API_KEY`                                   | `portkey`             |
| Cloudflare Workers AI | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`     | `cloudflareWorkersAi` |
| OpenRouter            | `OPENROUTER_API_KEY`                                | `openrouter`          |
| Crosshatch            | `CROSSHATCH_API_KEY`                                | `crosshatch`          |
| Mixedbread            | `MIXEDBREAD_API_KEY`                                | `mixedbread`          |
| Voyage                | `VOYAGE_API_KEY`                                    | `voyage`              |
| Mem0                  | `MEM0_API_KEY`                                      | `mem0`                |
| Spark                 | `SPARK_APP_ID`, `SPARK_API_KEY`, `SPARK_API_SECRET` | `spark`               |
| Anthropic Vertex      | `GOOGLE_APPLICATION_CREDENTIALS`                    | `anthropicVertex`     |
| Zhipu AI              | `ZHIPU_API_KEY`                                     | `zhipu`               |
| LangDB                | `LANGDB_API_KEY`                                    | `langdb`              |
| NVIDIA NIM            | `NVIDIA_NIM_API_KEY`                                | `nvidianim`           |
| Baseten               | `BASETEN_API_KEY`                                   | `baseten`             |
| Inflection AI         | `INFLECTION_API_KEY`                                | `inflection`          |
