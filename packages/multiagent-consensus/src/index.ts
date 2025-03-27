/**
 * multiagent-consensus
 * A framework for running multi-agent consensus processes using multiple LLMs
 */

import { ConsensusEngine } from './consensus/engine';
import { ConsensusConfig } from './types/config';
import { ConsensusResult } from './types/result';

// Re-export main types and interfaces
export * from './types/config';
export * from './types/result';
export * from './types/provider';

/**
 * Main API for the multiagent-consensus package
 * @param config Configuration options for the consensus process
 * @returns A ConsensusEngine instance
 */
export function createConsensus(config: ConsensusConfig): ConsensusEngine {
  return new ConsensusEngine(config);
}

// Default export
export default {
  createConsensus,
};
