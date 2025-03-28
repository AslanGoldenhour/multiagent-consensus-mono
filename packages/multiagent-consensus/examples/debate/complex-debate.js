/**
 * Complex example of multi-round debate mode
 *
 * This example demonstrates how to use the multi-round debate mode
 * for complex philosophical or abstract questions, showcasing how
 * multiple models can engage in a nuanced debate.
 *
 * To run this example:
 * 1. Rename .env.example to .env and add your API keys
 * 2. Run `node examples/debate/complex-debate.js`
 */

// Import the ConsensusEngine
import { ConsensusEngine } from '../../dist/index.js';

// Define a complex, abstract query
const ABSTRACT_QUERY = 'What is the meaning of life?';

// Create a new ConsensusEngine with debate configuration
const engine = new ConsensusEngine({
  // Use at least 3 models for a more nuanced debate
  models: [
    'openai:gpt-4', // More capable model for nuanced responses
    'anthropic:claude-3-haiku',
    'anthropic:claude-3-sonnet',
  ],

  // Configure consensus settings
  consensusMethod: 'supermajority', // Require 75% agreement for more rigorous consensus
  maxRounds: 5, // Allow more rounds for complex topics

  // Enable debate mode with specific settings
  debate: {
    minRounds: 3, // Ensure at least 3 rounds of discussion
    useSpecializedPrompts: true, // Use abstract query specialized prompts
    revealModelIdentities: true, // Allow models to reference each other by name
  },

  // Output configuration
  output: {
    includeHistory: true, // Include full debate history
    includeMetadata: true, // Include detailed metadata
  },

  // Configure model-specific parameters
  modelConfig: {
    'openai:gpt-4': {
      temperature: 0.7, // Higher temperature for more creative responses
      systemPrompt:
        'You are a thoughtful philosopher specializing in existential questions. Consider diverse perspectives and acknowledge the complexity of abstract questions.',
    },
    'anthropic:claude-3-haiku': {
      temperature: 0.6,
      systemPrompt:
        'You are a pragmatic philosopher focused on everyday meaning. Consider how ordinary people find purpose in their daily lives.',
    },
    'anthropic:claude-3-sonnet': {
      temperature: 0.8,
      systemPrompt:
        'You are a philosopher specializing in comparative religion and cultural perspectives. Consider how different traditions and cultures approach meaning and purpose.',
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

  if (result.metadata.confidenceScores) {
    console.log('\nConfidence Scores:');
    Object.entries(result.metadata.confidenceScores).forEach(([model, score]) => {
      console.log(`- ${model}: ${score.toFixed(2)}`);
    });
  }

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
        console.log(
          `  Round ${round.round}: ${(round.agreementLevel * 100).toFixed(1)}% agreement`
        );
      });
    }
  }

  if (result.enhancedHistory) {
    console.log('\n=== ENHANCED DEBATE HISTORY ===');

    result.enhancedHistory.forEach(round => {
      console.log(`\n--- ROUND ${round.round} ---`);

      round.responses.forEach(response => {
        console.log(
          `\n${response.model} (Confidence: ${response.confidence ? response.confidence.toFixed(2) : 'N/A'}):`
        );

        // Print a truncated version of the response for readability
        const maxLength = 200;
        const truncatedResponse =
          response.response.length > maxLength
            ? `${response.response.substring(0, maxLength)}...`
            : response.response;
        console.log(`Response: ${truncatedResponse}`);

        // If there are agreements/disagreements, print them
        if (response.agreements && response.agreements.length > 0) {
          console.log('\nRelationships with other models:');

          response.agreements.forEach(agreement => {
            const relationship = agreement.agrees ? 'Agrees with' : 'Disagrees with';
            console.log(`- ${relationship} ${agreement.model}`);

            if (agreement.explanation) {
              // Print a truncated explanation
              const maxExplanationLength = 100;
              const truncatedExplanation =
                agreement.explanation.length > maxExplanationLength
                  ? `${agreement.explanation.substring(0, maxExplanationLength)}...`
                  : agreement.explanation;
              console.log(`  Context: "${truncatedExplanation}"`);
            }
          });
        }
      });
    });
  }

  // Print the conclusion
  console.log('\n=== CONCLUSION ===');
  console.log(
    `After ${result.metadata.rounds} rounds of debate, the models ${result.debateMetadata?.consensusReached ? 'reached consensus' : 'did not reach full consensus'}.`
  );
  console.log(`Final answer: ${result.answer}`);
}

// Run the debate
async function runDebate() {
  console.log(`\nRunning multi-round debate on complex query: "${ABSTRACT_QUERY}"`);
  console.log('This may take some time as multiple models engage in multiple rounds...');

  try {
    const startTime = Date.now();
    const result = await engine.runDebate(ABSTRACT_QUERY);
    const totalTime = (Date.now() - startTime) / 1000;

    console.log(`\nDebate completed in ${totalTime.toFixed(1)} seconds`);
    printDebateResult(result);
  } catch (error) {
    console.error('Error running debate:', error);
  }
}

// Run the example
runDebate().catch(error => {
  console.error('Unexpected error:', error);
});
