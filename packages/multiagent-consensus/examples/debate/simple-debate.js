/**
 * Simple example of multi-round debate mode
 *
 * This example demonstrates how to use the multi-round debate mode
 * with different LLM models to achieve consensus on a given query.
 *
 * To run this example:
 * 1. Either:
 *    a) Rename .env.example to .env and add your API keys, OR
 *    b) Provide API keys directly in the config as shown below
 * 2. Run `node examples/debate/simple-debate.js`
 */

// Import the ConsensusEngine
import { ConsensusEngine } from '../../dist/index.js';

// Define a factual/arithmetic query
const FACTUAL_QUERY = 'What is 4+4?';

// Define a more complex, abstract query
const ABSTRACT_QUERY = 'What is the meaning of life?';

// Define the models we'll use for the debate
const models = [
  'claude-3-5-haiku-20241022', // Using officially supported Claude model from Vercel AI SDK
  'claude-3-5-haiku-20241022', // Using officially supported Claude model from Vercel AI SDK
];

// Read API keys from environment or use placeholders
// In a real application, these would come from secure sources
// You can provide them directly here or use .env files
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'your-anthropic-api-key';

// Create a new ConsensusEngine with debate configuration
const engine = new ConsensusEngine({
  // Use multiple models for debate
  models,

  // Configure consensus settings
  consensusMethod: 'majority',
  maxRounds: 3,

  // Enable debate mode with specific settings
  debate: {
    minRounds: 2, // Run at least 2 rounds regardless of consensus
    useSpecializedPrompts: true, // Use different prompts for factual vs abstract queries
    revealModelIdentities: true, // Allow models to see which model gave which response
  },

  // Output configuration
  output: {
    includeHistory: true, // Include debate history in the result
    includeMetadata: true, // Include metadata about token usage, timing, etc.
  },

  // Add model-specific configuration
  modelConfig: {
    'grok-1': {
      // Changed from 'xai:mixtral-8x7b-32768'
      temperature: 0.7,
      systemPrompt:
        "You are a helpful assistant participating in a multi-agent debate. Provide clear, logical responses and engage constructively with other models' answers.",
    },
  },

  // Directly provide API keys (alternative to using .env files)
  // This makes the package more portable and easier to use
  // You would normally load these from a secure source
  apiKeys: {
    anthropic: ANTHROPIC_API_KEY,
    // Add other provider keys as needed:
    // openai: 'your-openai-api-key',
    // xai: 'your-xai-api-key',
  },

  consensus: {
    method: 'debate',
    config: {
      facilitator: {
        model: 'claude-3-5-haiku-20241022', // Using officially supported Claude model
        temperature: 0,
      },
      rounds: 2,
    },
  },
});

// Helper function to print debate results in a readable format
function printDebateResult(result) {
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

    if (result.debateMetadata.agreementAnalysis) {
      console.log('\nAgreement Analysis:');
      console.log(`- Trend: ${result.debateMetadata.agreementAnalysis.trend}`);
      console.log('- By Round:');

      result.debateMetadata.agreementAnalysis.byRound.forEach(round => {
        console.log(`  Round ${round.round}: ${(round.agreementLevel * 100).toFixed(1)}%`);
      });
    }
  }

  if (result.enhancedHistory) {
    console.log('\nEnhanced Debate History:');

    result.enhancedHistory.forEach(round => {
      console.log(`\n--- ROUND ${round.round} ---`);

      round.responses.forEach(response => {
        console.log(
          `\n${response.model} (Confidence: ${response.confidence ? response.confidence.toFixed(2) : 'N/A'}):`
        );
        console.log(`Response: ${response.response.substring(0, 150)}...`);

        if (response.agreements && response.agreements.length > 0) {
          console.log('Agreements:');

          response.agreements.forEach(agreement => {
            console.log(`- ${agreement.model}: ${agreement.agrees ? 'Agrees' : 'Disagrees'}`);
          });
        }
      });
    });
  }
}

// Run the factual debate
async function runFactualDebate() {
  console.log(`\nRunning debate on factual query: "${FACTUAL_QUERY}"`);

  try {
    const result = await engine.runDebate(FACTUAL_QUERY);
    printDebateResult(result);
  } catch (error) {
    console.error('Error running factual debate:', error);
  }
}

// Run the abstract debate
async function runAbstractDebate() {
  console.log(`\nRunning debate on abstract query: "${ABSTRACT_QUERY}"`);

  try {
    const result = await engine.runDebate(ABSTRACT_QUERY);
    printDebateResult(result);
  } catch (error) {
    console.error('Error running abstract debate:', error);
  }
}

// Run both debates
async function main() {
  console.log('Multi-Round Debate Mode Example');

  // First run with caching enabled
  console.log('\n=== FIRST RUN (Caching Enabled) ===');
  await runFactualDebate();
  console.log('\n------------------------------------\n');
  await runAbstractDebate();

  // Second run with cache bypassing to see different results
  console.log('\n\n=== SECOND RUN (Bypassing Cache) ===');
  console.log('Running the same queries but bypassing cache to get fresh responses...');

  // Create a new engine with cache bypass enabled
  const bypassEngine = new ConsensusEngine({
    models: [
      'claude-3-5-haiku-20241022', // Using officially supported Claude model
      'claude-3-5-haiku-20241022', // Using officially supported Claude model
    ],
    consensusMethod: 'majority',
    maxRounds: 3,
    debate: {
      minRounds: 2,
      useSpecializedPrompts: true,
      revealModelIdentities: true,
    },
    output: {
      includeHistory: true,
      includeMetadata: true,
    },
    modelConfig: {
      'grok-1': {
        temperature: 0.7,
        systemPrompt:
          "You are a helpful assistant participating in a multi-agent debate. Provide clear, logical responses and engage constructively with other models' answers.",
      },
    },
    // Enable cache bypassing
    cache: {
      enabled: true, // Caching system is still enabled
      bypass: true, // But we bypass the cache for this request
      adapter: 'memory', // Using memory adapter
    },
  });

  // Run debates with cache bypassing
  console.log('\nRunning factual debate with cache bypass...');
  try {
    const factualResult = await bypassEngine.runDebate(FACTUAL_QUERY);
    console.log('\n=== FACTUAL DEBATE (BYPASS CACHE) ===');
    console.log(`Final Answer: ${factualResult.answer}`);
  } catch (error) {
    console.error('Error running factual debate with cache bypass:', error);
  }

  console.log('\nRunning abstract debate with cache bypass...');
  try {
    const abstractResult = await bypassEngine.runDebate(ABSTRACT_QUERY);
    console.log('\n=== ABSTRACT DEBATE (BYPASS CACHE) ===');
    console.log(`Final Answer: ${abstractResult.answer}`);
  } catch (error) {
    console.error('Error running abstract debate with cache bypass:', error);
  }

  // Demonstrate cache busting (force refresh)
  console.log('\n\n=== THIRD RUN (Busting Cache) ===');
  console.log('Running the same queries but busting the cache to force refresh...');

  // Create a new engine with cache busting enabled
  const bustCacheEngine = new ConsensusEngine({
    models: [
      'claude-3-5-haiku-20241022', // Using officially supported Claude model
      'claude-3-5-haiku-20241022', // Using officially supported Claude model
    ],
    consensusMethod: 'majority',
    maxRounds: 3,
    debate: {
      minRounds: 2,
      useSpecializedPrompts: true,
      revealModelIdentities: true,
    },
    output: {
      includeHistory: true,
      includeMetadata: true,
    },
    // Enable cache busting
    cache: {
      enabled: true, // Caching system is still enabled
      bustCache: true, // But we force refresh the cache entries
      adapter: 'memory', // Using memory adapter
    },
  });

  // Run simple debate with cache busting
  console.log('\nRunning factual debate with cache busting...');
  try {
    const factualResult = await bustCacheEngine.runDebate(FACTUAL_QUERY);
    console.log('\n=== FACTUAL DEBATE (BUST CACHE) ===');
    console.log(`Final Answer: ${factualResult.answer}`);
  } catch (error) {
    console.error('Error running debate with cache busting:', error);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
});
