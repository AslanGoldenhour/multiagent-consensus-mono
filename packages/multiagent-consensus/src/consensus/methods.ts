/**
 * Interface for a consensus method function
 */
type ConsensusMethodFunction = (
  responses: Array<{
    model: string;
    response: string;
    confidence?: number;
  }>
) => {
  consensusReached: boolean;
  answer: string;
};

/**
 * Simple majority consensus method
 * @param responses Array of model responses
 * @returns Consensus result
 */
const majorityConsensus: ConsensusMethodFunction = responses => {
  // Count occurrences of each unique response
  const responseCounts = new Map<string, number>();
  const responsesByText = new Map<string, string>();

  responses.forEach(response => {
    const text = response.response;
    responsesByText.set(text, text);
    responseCounts.set(text, (responseCounts.get(text) || 0) + 1);
  });

  // Find the response with the most votes
  let maxCount = 0;
  let majorityResponse = '';

  responseCounts.forEach((count, response) => {
    if (count > maxCount) {
      maxCount = count;
      majorityResponse = response;
    }
  });

  // Calculate if majority threshold is met (more than 50%)
  const consensusReached = maxCount > responses.length / 2;

  return {
    consensusReached,
    answer: majorityResponse,
  };
};

/**
 * Supermajority consensus method (75% agreement)
 * @param responses Array of model responses
 * @returns Consensus result
 */
const supermajorityConsensus: ConsensusMethodFunction = responses => {
  // Count occurrences of each unique response
  const responseCounts = new Map<string, number>();
  const responsesByText = new Map<string, string>();

  responses.forEach(response => {
    const text = response.response;
    responsesByText.set(text, text);
    responseCounts.set(text, (responseCounts.get(text) || 0) + 1);
  });

  // Find the response with the most votes
  let maxCount = 0;
  let majorityResponse = '';

  responseCounts.forEach((count, response) => {
    if (count > maxCount) {
      maxCount = count;
      majorityResponse = response;
    }
  });

  // Calculate if supermajority threshold is met (75% or more)
  const consensusReached = maxCount >= responses.length * 0.75;

  return {
    consensusReached,
    answer: majorityResponse,
  };
};

/**
 * Unanimous consensus method (all models agree)
 * @param responses Array of model responses
 * @returns Consensus result
 */
const unanimousConsensus: ConsensusMethodFunction = responses => {
  // Check if all responses are the same
  const firstResponse = responses[0]?.response || '';
  const consensusReached = responses.every(r => r.response === firstResponse);

  return {
    consensusReached,
    answer: firstResponse,
  };
};

/**
 * Return the appropriate consensus method function based on the method name
 * @param method The consensus method name
 * @returns The consensus method function
 */
export function getConsensusMethod(
  method: 'majority' | 'supermajority' | 'unanimous'
): ConsensusMethodFunction {
  switch (method) {
    case 'supermajority':
      return supermajorityConsensus;
    case 'unanimous':
      return unanimousConsensus;
    case 'majority':
    default:
      return majorityConsensus;
  }
}
