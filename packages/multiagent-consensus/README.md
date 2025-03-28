# Multiagent Consensus

[![Test Coverage](https://img.shields.io/static/v1?label=coverage&message=92.5%25&color=brightgreen&t=1743184008204)](https://github.com/AslanGoldenhour/multiagent-consensus-mono)
[![Lines of Code](https://img.shields.io/static/v1?label=lines%20of%20code&message=4.5k&color=blue&t=1743184008204)](https://github.com/AslanGoldenhour/multiagent-consensus-mono)
[![Tests](https://img.shields.io/static/v1?label=tests&message=110%20passed&color=brightgreen&t=1743184008204)](https://github.com/AslanGoldenhour/multiagent-consensus-mono)

[![npm version](https://img.shields.io/npm/v/multiagent-consensus.svg)](https://www.npmjs.com/package/multiagent-consensus)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A framework for running multi-agent consensus processes using multiple Large Language Models (LLMs). This library enables a "jury" of AI models to debate and reach consensus on queries, providing more robust and balanced responses.

## Features

- 🤖 **Multiple LLM Support**: Compatible with various LLM providers through the Vercel AI SDK
- 🔄 **Configurable Consensus Methods**: Choose from majority, supermajority (75%), or unanimous agreement
- 🧠 **Multi-round Debates**: Models can debate in multiple rounds to refine their thinking
- 📊 **Detailed Results**: Get comprehensive metadata including confidence scores and processing time
- 🧪 **Flexible Output**: Customize output format (text, JSON) and content detail
- 🛠️ **Highly Configurable**: Set bias, system prompts, and customize debate parameters
- 🧩 **Extensible Provider System**: Support for all Vercel AI SDK providers with the ability to register custom providers
- 💾 **Response Caching**: Cache LLM responses to reduce API costs and improve performance

## Installation

```bash
npm install multiagent-consensus
```

Or with yarn:

```bash
yarn add multiagent-consensus
```

## Basic Usage

```typescript
import { ConsensusEngine } from 'multiagent-consensus';

// Create a consensus engine with your configuration
const engine = new ConsensusEngine({
  models: ['claude-3-haiku', 'gpt-4', 'palm-2'],
  consensusMethod: 'majority', // 'majority', 'supermajority', or 'unanimous'
  maxRounds: 2, // Maximum number of debate rounds
  output: {
    includeHistory: true, // Include debate history in result
    includeMetadata: true, // Include metadata in result
    format: 'text', // 'text' or 'json'
  },
});

// Run a consensus process
async function getConsensus() {
  const result = await engine.run('What is the best approach to solve climate change?');

  console.log('Final Answer:', result.answer);

  if (result.history) {
    console.log('Debate History:');
    result.history.forEach((round, i) => {
      console.log(`\nRound ${i + 1}:`);
      round.responses.forEach(response => {
        console.log(`${response.model}: ${response.response}`);
      });
    });
  }

  console.log('\nMetadata:', result.metadata);
}

getConsensus();
```

## API Reference

### ConsensusEngine

The main class for running consensus processes.

```typescript
constructor(config: ConsensusConfig)
```

#### ConsensusConfig

| Parameter       | Type                                         | Description                       | Default    |
| --------------- | -------------------------------------------- | --------------------------------- | ---------- |
| models          | string[]                                     | Array of model identifiers to use | Required   |
| consensusMethod | 'majority' \| 'supermajority' \| 'unanimous' | Method to determine consensus     | 'majority' |
| maxRounds       | number                                       | Maximum number of debate rounds   | 3          |
| output          | OutputConfig                                 | Output configuration              | See below  |

#### OutputConfig

| Parameter       | Type             | Description                 | Default |
| --------------- | ---------------- | --------------------------- | ------- |
| includeHistory  | boolean          | Include full debate history | false   |
| includeMetadata | boolean          | Include metadata in result  | true    |
| format          | 'text' \| 'json' | Output format               | 'text'  |

### ConsensusResult

The result of a consensus process.

| Property | Type           | Description                                |
| -------- | -------------- | ------------------------------------------ |
| answer   | string         | The final consensus answer                 |
| models   | string[]       | Models that participated in the debate     |
| metadata | ResultMetadata | Information about the process              |
| history? | RoundData[]    | Debate history (if includeHistory is true) |

#### ResultMetadata

| Property         | Type                   | Description                                    |
| ---------------- | ---------------------- | ---------------------------------------------- |
| totalTokens      | number                 | Total tokens used across all models and rounds |
| processingTimeMs | number                 | Total processing time in milliseconds          |
| rounds           | number                 | Number of debate rounds conducted              |
| consensusMethod  | string                 | Method used to determine consensus             |
| confidenceScores | Record<string, number> | Self-reported confidence per model             |

## Consensus Methods

### Majority

Requires more than 50% of the models to agree on an answer. This is the most lenient consensus method and works well for straightforward queries.

### Supermajority

Requires at least 75% of the models to agree. This provides a more stringent threshold for consensus, useful for complex or controversial topics.

### Unanimous

Requires all models to agree completely. This is the strictest form of consensus and may require multiple debate rounds to achieve.

## Setting Up Environment Variables

For using this package with LLM providers, you'll need to set up environment variables for API keys:

```
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
# Add other provider keys as needed
```

We recommend using dotenv for local development. First, create a `.env` file in your project root:

```bash
# Copy the example env file from the examples directory
cp node_modules/multiagent-consensus/examples/.env.example .env
# Then edit the .env file with your actual API keys
```

Then in your application:

```typescript
// In your application's entry point
import 'dotenv/config';
```

The package supports many providers through the Vercel AI SDK. See the `.env.example` file in the examples directory for all supported environment variables.

## Examples

### Custom Debate with Specific System Prompts

```typescript
const engine = new ConsensusEngine({
  models: ['claude-3-sonnet', 'gpt-4', 'gpt-3.5-turbo'],
  consensusMethod: 'supermajority',
  maxRounds: 3,
  modelConfig: {
    'claude-3-sonnet': {
      systemPrompt: 'You are a scientific expert focused on evidence-based reasoning.',
      temperature: 0.5,
    },
    'gpt-4': {
      systemPrompt: 'You are a philosophical thinker who considers ethical implications.',
      temperature: 0.7,
    },
    'gpt-3.5-turbo': {
      systemPrompt: 'You are a practical problem-solver focusing on realistic solutions.',
      temperature: 0.3,
    },
  },
  output: {
    includeHistory: true,
    format: 'json',
  },
});
```

### Using Bias Presets

```typescript
const engine = new ConsensusEngine({
  models: ['claude-3-opus', 'gpt-4', 'llama-3'],
  consensusMethod: 'majority',
  biasPresets: ['centrist', 'progressive', 'conservative'],
  output: {
    includeHistory: true,
  },
});
```

## Running the Examples

The package includes a JavaScript example to demonstrate functionality.

### As a Package Consumer

When you've installed the published package as a dependency in your project:

```bash
# Install the package
npm install multiagent-consensus

# Copy the example file to your project
# Run the JavaScript example
node simple-consensus.js
```

### As a Package Developer

When developing the package itself:

```bash
# From the package directory
npm run build         # Build the package first - this creates the dist directory
npm run example       # Run the JavaScript example
```

The build step is crucial as it compiles the TypeScript source files into JavaScript in the `dist` directory. The example imports code from this directory, so if you make changes to the source files, you'll need to rebuild the package before running the example again.

## 📊 Code Metrics

- **Total**: 3974 lines

### By Language

| Language | Lines |
| -------- | ----- |
| ts       | 3,174 |
| js       | 800   |

### By Category

| Category | Lines |
| -------- | ----- |
| core     | 3,174 |
| examples | 776   |
| configs  | 13    |
| other    | 11    |

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Supported LLM Providers

This package supports all providers available in the Vercel AI SDK. The key providers include:

- **OpenAI** (`@ai-sdk/openai`): GPT-4, GPT-4 Turbo, GPT-4o, GPT-3.5 Turbo
- **Anthropic** (`@ai-sdk/anthropic`): Claude 3 Opus, Sonnet, Haiku, Claude 2 series
- **Google** (`@ai-sdk/google`): Gemini Pro, Gemini Pro Vision
- **Mistral** (`@ai-sdk/mistral`): Mistral's various models
- **Cohere** (`@ai-sdk/cohere`): Command series
- **Groq** (`@ai-sdk/groq`): Ultra-fast inference for Llama, Mixtral
- **Amazon Bedrock** (`@ai-sdk/amazon-bedrock`): Access to Amazon's hosted models
- **Azure** (`@ai-sdk/azure`): Azure-hosted OpenAI models
- **Google Vertex AI** (`@ai-sdk/google-vertex`): Google Cloud's AI offerings
- And many more!

### Using Providers

To use a specific provider, simply install the corresponding package:

```bash
npm install @ai-sdk/openai  # For OpenAI models
npm install @ai-sdk/anthropic  # For Claude models
# etc.
```

The package will automatically detect which providers are installed and make them available for use.

### Registering Custom Providers

You can register custom providers programmatically:

```typescript
import { registerProvider } from 'multiagent-consensus';

// Register a custom provider
registerProvider('my-custom-provider-package', {
  name: 'customProvider',
  models: ['custom-model-1', 'custom-model-2'],
});
```

## Caching System

The library includes a flexible caching system to store and reuse responses, which can significantly improve performance and reduce API costs.

```typescript
// Enable caching with default settings
const engine = new ConsensusEngine({
  models: ['claude-3-haiku', 'gpt-4'],
  cache: {
    enabled: true, // Uses in-memory cache with 1-hour TTL by default
  },
});

// Advanced caching configuration
const engine = new ConsensusEngine({
  models: ['claude-3-haiku', 'gpt-4'],
  cache: {
    enabled: true,
    adapter: 'redis', // Use Redis for shared caching across instances
    ttl: 86400, // 24-hour TTL
    adapterOptions: {
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    },
  },
});

// File-based caching configuration
const engine = new ConsensusEngine({
  models: ['claude-3-haiku', 'gpt-4'],
  cache: {
    enabled: true,
    adapter: 'file', // Use file-based persistent storage
    ttl: 86400, // 24-hour TTL
    adapterOptions: {
      cacheDir: './cache', // Directory to store cache files
      createDirIfNotExists: true, // Create directory if it doesn't exist
      maxAge: 604800, // Clean up files older than 7 days (in seconds)
    },
  },
});

// Manual cache operations
await engine.cache.clear(); // Clear the entire cache
await engine.cache.delete('specific-key'); // Delete a specific entry
```

### Available Cache Adapters

- **Memory**: An in-memory cache suitable for development and single-instance applications
- **File**: File-based persistent cache for development, debugging, and single-server applications
- **Redis**: Distributed cache for multi-server production applications
- **Custom Adapters**: Create your own adapter by implementing the `CacheAdapter` interface

### Configuring Caching via Environment Variables

You can configure caching using environment variables:

```
# Caching Configuration
ENABLE_CACHE=true              # Enable response caching
CACHE_ADAPTER=memory           # 'memory', 'file', or 'redis'
CACHE_TTL_SECONDS=3600         # Cache TTL in seconds (1 hour)

# Redis Configuration (when using Redis adapter)
REDIS_URL=redis://localhost:6379
REDIS_TOKEN=your_auth_token
REDIS_PREFIX=consensus:        # Key prefix for Redis cache entries

# File Cache Configuration (when using file adapter)
CACHE_DIR=./cache             # Directory to store cache files
```

### Caching Benefits

- **Reduced API Costs**: Avoid redundant API calls for identical queries
- **Improved Response Time**: Get instant responses for cached queries
- **Consistent Answers**: Ensure the same query always yields the same response
- **Configurable Expiration**: Set time-to-live (TTL) to control cache freshness
- **Persistence Options**: Choose between in-memory, file-based, or Redis storage
- **Performance Metrics**: Track cache hits, misses, and time saved
