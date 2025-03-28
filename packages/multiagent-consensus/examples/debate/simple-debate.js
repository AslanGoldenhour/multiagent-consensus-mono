/**
 * Simple example of multi-round debate mode
 *
 * This example demonstrates how to use the multi-round debate mode
 * with different LLM models from various providers to achieve consensus on a given query.
 *
 * To run this example:
 * 1. Either:
 *    a) Rename .env.example to .env and add your API keys, OR
 *    b) Provide API keys directly in the config as shown below
 * 2. Run `node examples/debate/simple-debate.js`
 */

// Import the ConsensusEngine
import { ConsensusEngine } from '../../dist/index.js';
// Import the envManager to properly load environment variables from .env files
import { envManager } from '../../dist/utils/env.js';

// Define example queries
const FACTUAL_QUERY = 'What is 4+4?';
const ABSTRACT_QUERY = 'What is the meaning of life?';

// Make sure environment variables are initialized
// This will load variables from .env and .env.local files
envManager.init();

// Get API keys using the envManager utility
const ANTHROPIC_API_KEY = envManager.get('ANTHROPIC_API_KEY') || 'your-anthropic-api-key';
const OPENAI_API_KEY = envManager.get('OPENAI_API_KEY') || 'your-openai-api-key';
const XAI_API_KEY = envManager.get('XAI_API_KEY') || 'your-xai-api-key';

// Create a new ConsensusEngine with debate configuration
const engine = new ConsensusEngine({
  // Use models from three different providers for a diverse debate
  models: [
    'gpt-4o', // OpenAI's latest model
    'claude-3-5-sonnet-20240620', // Anthropic's Claude model
    'grok-beta', // X.AI's Grok model
  ],

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

  // Model-specific configurations
  modelConfig: {
    'gpt-4o': {
      temperature: 0.7,
      systemPrompt:
        "You are a helpful AI assistant participating in a multi-agent debate. Provide clear, logical responses and engage constructively with other models' answers.",
    },
    'claude-3-5-sonnet-20240620': {
      temperature: 0.7,
      systemPrompt:
        'You are an AI assistant specialized in critical thinking and logical reasoning. Analyze problems systematically and identify flaws in reasoning.',
    },
    'grok-1': {
      temperature: 0.7,
      systemPrompt:
        'You are an AI assistant with a penchant for creative problem-solving. Approach questions from unique angles and consider unconventional perspectives.',
    },
  },

  // Directly provide API keys (alternative to using .env files)
  apiKeys: {
    anthropic: ANTHROPIC_API_KEY,
    openai: OPENAI_API_KEY,
    xai: XAI_API_KEY,
  },
});

// Helper function to print debate results in a readable format
function printDebateResult(result) {
  console.log('\n' + '='.repeat(80));
  console.log(`DEBATE RESULT: ${result.answer}`.padStart(40 + result.answer.length / 2));
  console.log('='.repeat(80));

  // Print essential metadata
  console.log('\n📊 DEBATE METADATA:');
  console.log(`• Query Type: ${result.debateMetadata?.queryType || 'Unknown'}`);
  console.log(`• Rounds Completed: ${result.metadata.rounds}`);
  console.log(`• Processing Time: ${(result.metadata.processingTimeMs / 1000).toFixed(2)} seconds`);
  console.log(`• Total Tokens: ${result.metadata.totalTokens.toLocaleString()}`);
  console.log(`• Consensus Method: ${result.metadata.consensusMethod}`);
  console.log(`• Consensus Reached: ${result.debateMetadata?.consensusReached ? 'Yes' : 'No'}`);

  // Print agreement analysis if available
  if (result.debateMetadata?.agreementAnalysis) {
    const analysis = result.debateMetadata.agreementAnalysis;
    console.log('\n📈 AGREEMENT ANALYSIS:');
    console.log(`• Trend: ${analysis.trend}`);
    console.log('• Agreement by Round:');

    analysis.byRound.forEach(round => {
      const percentage = (round.agreementLevel * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(round.agreementLevel * 20));
      console.log(`  Round ${round.round}: ${percentage}% ${bar}`);
    });
  }

  // Print debate history with proper formatting
  if (result.enhancedHistory) {
    console.log('\n🗣️ DEBATE HISTORY:');

    result.enhancedHistory.forEach(round => {
      console.log(`\n📌 ROUND ${round.round}:`);

      round.responses.forEach(response => {
        // Add provider icon based on model name
        let providerIcon = '🤖';
        if (response.model.includes('gpt')) providerIcon = '🟢'; // OpenAI
        if (response.model.includes('claude')) providerIcon = '🟣'; // Anthropic
        if (response.model.includes('grok')) providerIcon = '🔵'; // X.AI

        const confidence = response.confidence
          ? `(Confidence: ${response.confidence.toFixed(2)})`
          : '';

        console.log(`\n  ${providerIcon} ${response.model} ${confidence}`);

        // Format the response text for better readability
        const fullResponse = response.response;
        const truncatedResponse =
          fullResponse.length > 300 ? fullResponse.substring(0, 300) + '...' : fullResponse;

        // Split into paragraphs for better readability
        truncatedResponse.split('\n').forEach(paragraph => {
          if (paragraph.trim()) {
            console.log(`    ${paragraph.trim()}`);
          }
        });

        // Show agreements if available
        if (response.agreements && response.agreements.length > 0) {
          console.log('    Agreements:');

          response.agreements.forEach(agreement => {
            // Add provider icon for agreements too
            let agreeIcon = '🤖';
            if (agreement.model.includes('gpt')) agreeIcon = '🟢';
            if (agreement.model.includes('claude')) agreeIcon = '🟣';
            if (agreement.model.includes('grok')) agreeIcon = '🔵';

            const symbol = agreement.agrees ? '✅' : '❌';
            console.log(
              `    ${symbol} ${agreeIcon} ${agreement.model}: ${agreement.agrees ? 'Agrees' : 'Disagrees'}`
            );
          });
        }
      });
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// Main function to run the examples
async function main() {
  console.log('🤖 MULTI-PROVIDER DEBATE MODE EXAMPLE 🤖');
  console.log('============================================');
  console.log('Using models from:');
  console.log('🟢 OpenAI (GPT-4o)');
  console.log('🟣 Anthropic (Claude)');
  console.log('🔵 X.AI (Grok)');
  console.log('============================================');

  // Run factual debate example
  try {
    console.log(`\nRunning debate on factual query: "${FACTUAL_QUERY}"`);
    const factualResult = await engine.runDebate(FACTUAL_QUERY);
    printDebateResult(factualResult);
  } catch (error) {
    console.error('❌ Error running factual debate:', error);
  }

  // Run abstract debate example
  try {
    console.log(`\nRunning debate on abstract query: "${ABSTRACT_QUERY}"`);
    const abstractResult = await engine.runDebate(ABSTRACT_QUERY);
    printDebateResult(abstractResult);
  } catch (error) {
    console.error('❌ Error running abstract debate:', error);
  }
}

// Run the examples
main().catch(error => {
  console.error('❌ Unexpected error:', error);
});
