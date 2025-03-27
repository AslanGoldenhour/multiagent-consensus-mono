# Multiagent Consensus

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
COHERE_API_KEY=your_cohere_key_here
```

We recommend using dotenv for local development:

```typescript
// In your application's entry point
import 'dotenv/config';
```

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Running the Examples

The package includes both JavaScript and TypeScript examples to demonstrate functionality:

### JavaScript Example

```bash
# Install the package
npm install multiagent-consensus

# Run the example
node simple-consensus.js
```

### TypeScript Example

```bash
# Install the package and TypeScript support
npm install multiagent-consensus
npm install -D typescript ts-node @types/node

# Run the example directly with ts-node
npx ts-node typescript-example.ts
```

### For Package Development

When developing the package itself:

```bash
# From the package directory
npm run example       # Run the JavaScript example
npm run example:ts    # Run the TypeScript example
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
