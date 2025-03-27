/* eslint-disable */
/**
 * Simple Consensus Example
 *
 * This example demonstrates using the multiagent-consensus package with JavaScript.
 *
 * To run this example:
 * 1. Install the package: npm install multiagent-consensus
 * 2. Ensure you have set up your environment variables for API keys
 * 3. Run with: node simple-consensus.js
 */

// Import the package
const { ConsensusEngine } = require('multiagent-consensus');
require('dotenv').config();

/**
 * Create a consensus engine with configuration
 * @type {ConsensusEngine}
 */
const engine = new ConsensusEngine({
  models: ['model-a', 'model-b', 'model-c', 'model-d'],
  consensusMethod: 'majority',
  maxRounds: 2,
  output: {
    includeHistory: true,
    includeMetadata: true,
    format: 'json',
  },
});

/**
 * Run a consensus process and display the results
 * @returns {Promise<void>}
 */
async function runConsensus() {
  console.log('Running consensus process...');
  const question = 'What are the three most effective ways to combat climate change?';
  console.log(`Question: ${question}`);

  try {
    const result = await engine.run(question);
    printResults(result);
  } catch (error) {
    console.error('Error running consensus:', error);
  }
}

/**
 * Print the consensus results in a formatted way
 * @param {Object} result - The result from the consensus engine
 * @param {string} result.answer - The final consensus answer
 * @param {Object} result.metadata - Metadata about the consensus process
 * @param {Array} result.history - The history of the debate rounds
 */
function printResults(result) {
  console.log('\n=== CONSENSUS RESULT ===');
  console.log(`Final Answer: ${result.answer}`);

  console.log('\n=== METADATA ===');
  console.log(`Consensus Method: ${result.metadata.consensusMethod}`);
  console.log(`Total Rounds: ${result.metadata.rounds}`);
  console.log(`Processing Time: ${result.metadata.processingTimeMs}ms`);

  if (result.history) {
    console.log('\n=== DEBATE HISTORY ===');
    result.history.forEach((round, i) => {
      console.log(`\n--- Round ${i + 1} ---`);
      round.responses.forEach(response => {
        console.log(`${response.model}: ${response.response}`);
      });
    });
  }
}

// Execute the example
runConsensus();
/* eslint-enable */
