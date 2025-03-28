/**
 * Example of using the ConsensusEngine with API keys provided directly in the config
 *
 * This example demonstrates how to use the debate mode without requiring .env files,
 * which is useful when integrating into existing applications or services.
 *
 * To run this example:
 * 1. Replace the placeholder API keys with your actual keys
 * 2. Run `node examples/debate/api-keys-example.js`
 */

import { ConsensusEngine } from '../../dist/index.js';

// Define a query for the debate
const QUERY = 'What is the best way to learn a new programming language?';

// In a real application, you would load these from your application's
// secure environment variables, secrets manager, or configuration system
const API_KEYS = {
  anthropic: process.env.ANTHROPIC_API_KEY, // Use the key from environment if available
  // Add other provider keys as needed:
  // openai: process.env.OPENAI_API_KEY,
  // xai: process.env.XAI_API_KEY,
};

async function main() {
  console.log('Running Debate with API keys provided directly in config...');

  // Create a ConsensusEngine with API keys provided directly
  const engine = new ConsensusEngine({
    // Use multiple models for the debate
    models: ['claude-3-5-haiku-20241022', 'claude-3-5-haiku-20241022'],

    // Provide API keys directly in the config
    // This eliminates the need for .env files
    apiKeys: API_KEYS,

    // Configure consensus settings
    consensusMethod: 'majority',
    maxRounds: 3,

    // Enable debate mode
    debate: {
      minRounds: 2,
      useSpecializedPrompts: true,
      revealModelIdentities: true,
    },

    // Output configuration
    output: {
      includeHistory: true,
      includeMetadata: true,
    },
  });

  try {
    console.log(`\nRunning debate query: "${QUERY}"`);
    const result = await engine.runDebate(QUERY);

    console.log('\n=== DEBATE RESULT ===');
    console.log(`Final Answer: ${result.answer}`);
    console.log('\nMetadata:');
    console.log(`- Total Tokens: ${result.metadata.totalTokens}`);
    console.log(`- Processing Time: ${result.metadata.processingTimeMs}ms`);
    console.log(`- Rounds: ${result.metadata.rounds}`);
    console.log(`- Consensus Method: ${result.metadata.consensusMethod}`);

    if (result.debateMetadata) {
      console.log('\nDebate Metadata:');
      console.log(`- Query Type: ${result.debateMetadata.queryType}`);
      console.log(`- Consensus Reached: ${result.debateMetadata.consensusReached}`);

      if (result.debateMetadata.consensusRound) {
        console.log(`- Consensus Round: ${result.debateMetadata.consensusRound}`);
      }
    }

    if (result.enhancedHistory) {
      console.log('\nResponse History Summary:');
      result.enhancedHistory.forEach(round => {
        console.log(`\n--- ROUND ${round.round} ---`);
        round.responses.forEach(response => {
          console.log(
            `\n${response.model} (Confidence: ${response.confidence ? response.confidence.toFixed(2) : 'N/A'}):`
          );
          // Print just the first 100 characters of each response for brevity
          console.log(`${response.response.substring(0, 100)}...`);
        });
      });
    }
  } catch (error) {
    console.error('Error running debate:', error);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
});
