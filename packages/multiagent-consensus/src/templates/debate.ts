/**
 * Templates for multi-round debate mode
 *
 * These templates provide the prompts used in different stages of a multi-round debate
 * between multiple AI models to achieve consensus on a given query.
 */

/**
 * Template for the initial round of a debate where models provide their first response
 * @param query The original user query to be debated
 * @returns The formatted prompt for the initial round
 */
export function initialRoundTemplate(query: string): string {
  return `
You are a helpful AI assistant participating in a multi-agent debate to produce the highest quality response to a user query. 
This is the FIRST round of the debate. You should provide your best, most thoughtful response to the following query:

QUERY: ${query}

Guidelines:
1. Be thorough, accurate, and objective in your response
2. If the query has a factual answer, provide it with evidence or reasoning
3. If the query is subjective, acknowledge different perspectives
4. Use logical reasoning and cite evidence when appropriate
5. If you're uncertain about something, acknowledge the limits of your knowledge
6. Format your response clearly and concisely
7. Focus on providing a high-quality standalone answer to the query

Respond directly with your answer without preamble.
`;
}

/**
 * Template for subsequent rounds of a debate where models critique and refine previous responses
 * @param query The original user query being debated
 * @param roundNumber The current round number (greater than 1)
 * @param previousResponses Array of responses from the previous round
 * @returns The formatted prompt for debate rounds after the first
 */
export function debateRoundTemplate(
  query: string,
  roundNumber: number,
  previousResponses: Array<{ model: string; response: string }>
): string {
  // Format previous responses into a string
  const formattedResponses = previousResponses
    .map((resp, index) => `RESPONSE ${index + 1} (${resp.model}): ${resp.response}`)
    .join('\n\n');

  return `
You are a helpful AI assistant participating in a multi-agent debate to produce the highest quality response to a user query.
This is ROUND ${roundNumber} of the debate. You have access to the original query and all responses from the previous round.

ORIGINAL QUERY: ${query}

PREVIOUS ROUND RESPONSES:
${formattedResponses}

Your task in this round:
1. Evaluate the strengths and weaknesses of ALL previous responses
2. Identify any factual errors, logical flaws, or missing perspectives in the responses
3. Acknowledge points you agree with and explain why
4. Propose improvements or alternative viewpoints where appropriate
5. Synthesize a new, improved response that builds on the collective insights

Guidelines:
1. Be constructive and respectful in your critique
2. Focus on improving the answer, not on criticizing other models
3. Cite specific parts of previous responses in your evaluation
4. Be willing to change your position if other responses make better points
5. Format your response clearly and provide a final, revised answer

Your response should begin with a brief analysis of the previous responses, followed by your updated answer to the original query.
`;
}

/**
 * Template for the final round of a debate where models provide their final answer and confidence
 * @param query The original user query being debated
 * @param roundNumber The current round number
 * @param previousResponses Array of responses from the previous round
 * @returns The formatted prompt for the final round
 */
export function finalRoundTemplate(
  query: string,
  roundNumber: number,
  previousResponses: Array<{ model: string; response: string }>
): string {
  // Format previous responses into a string
  const formattedResponses = previousResponses
    .map((resp, index) => `RESPONSE ${index + 1} (${resp.model}): ${resp.response}`)
    .join('\n\n');

  return `
You are a helpful AI assistant participating in a multi-agent debate to produce the highest quality response to a user query.
This is the FINAL ROUND (${roundNumber}) of the debate. You have access to the original query and all responses from the previous round.

ORIGINAL QUERY: ${query}

PREVIOUS ROUND RESPONSES:
${formattedResponses}

Your task in this final round:
1. Consider all the perspectives and information shared throughout the debate
2. Synthesize a final, comprehensive response that addresses the query
3. If there are remaining disagreements, explain the different perspectives
4. Provide your final answer along with a confidence score

Guidelines:
1. Your final answer should be complete and self-contained
2. Address any remaining conflicts or disagreements explicitly
3. Provide a confidence score from 0.0 to 1.0 (e.g., "Confidence: 0.85")
4. Format your response for clarity and readability
5. Prioritize accuracy and helpfulness in your final answer

Your response should end with your final answer and explicit confidence score in this format:
"FINAL ANSWER: [Your comprehensive answer here]
CONFIDENCE: [Your confidence score from 0.0 to 1.0]"
`;
}

/**
 * Template for simple arithmetic or factual questions to provide more direct guidance
 * @param query The original user query to be debated
 * @returns The formatted prompt for factual or arithmetic queries
 */
export function factualQueryTemplate(query: string): string {
  return `
You are a helpful AI assistant participating in a multi-agent debate to produce the correct answer to a factual query.
The query appears to be seeking a factual or arithmetic answer.

QUERY: ${query}

Guidelines:
1. Approach this systematically, showing your reasoning step-by-step
2. If this is an arithmetic problem, show your calculations clearly
3. If this is a factual question, provide the most accurate information
4. Double-check your work before providing the final answer
5. Be precise and concise in your response
6. Format any calculations or steps clearly

Provide your answer with clear reasoning. If it's a calculation, show your work.
`;
}

/**
 * Template for abstract or philosophical questions to encourage deeper exploration
 * @param query The original user query to be debated
 * @returns The formatted prompt for abstract or philosophical queries
 */
export function abstractQueryTemplate(query: string): string {
  return `
You are a helpful AI assistant participating in a multi-agent debate on a philosophical or abstract question.
The query appears to be examining a complex, abstract, or philosophical concept.

QUERY: ${query}

Guidelines:
1. Consider multiple perspectives and philosophical traditions
2. Acknowledge the subjective nature of the question where appropriate
3. Reference key thinkers or schools of thought if relevant
4. Avoid presenting one viewpoint as objectively correct
5. Explore the nuances and complexities of the question
6. Structure your response logically to navigate this complex topic
7. Focus on providing insight rather than a definitive answer

Provide a thoughtful, nuanced exploration of this question that acknowledges different perspectives.
`;
}
