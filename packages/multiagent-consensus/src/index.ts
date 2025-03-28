/**
 * Multiagent consensus package for making AI agents work together
 * to produce higher quality responses than any single agent.
 */

// Export the main functionality
export * from './consensus';
export * from './providers';
export * from './types';
export * from './utils';

// Export the caching functionality
export * from './cache';

// Default export
export { ConsensusEngine } from './consensus';

// Version number
export const VERSION = '0.1.0';
