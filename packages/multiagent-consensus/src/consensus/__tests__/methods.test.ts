import { getConsensusMethod } from '../methods';

describe('Consensus Methods', () => {
  // Test data
  const testResponses = [
    { model: 'model1', response: 'Yes' },
    { model: 'model2', response: 'Yes' },
    { model: 'model3', response: 'No' },
  ];

  const allSameResponses = [
    { model: 'model1', response: 'Yes' },
    { model: 'model2', response: 'Yes' },
    { model: 'model3', response: 'Yes' },
  ];

  const moreVariedResponses = [
    { model: 'model1', response: 'Yes' },
    { model: 'model2', response: 'No' },
    { model: 'model3', response: 'No' },
    { model: 'model4', response: 'Yes' },
    { model: 'model5', response: 'Maybe' },
  ];

  describe('majorityConsensus', () => {
    const majorityConsensus = getConsensusMethod('majority');

    it('should reach consensus when a simple majority exists', () => {
      const result = majorityConsensus(testResponses);
      expect(result.consensusReached).toBe(true);
      expect(result.answer).toBe('Yes');
    });

    it('should not reach consensus when no simple majority exists', () => {
      const noMajorityResponses = [
        { model: 'model1', response: 'Yes' },
        { model: 'model2', response: 'No' },
        { model: 'model3', response: 'Maybe' },
      ];
      const result = majorityConsensus(noMajorityResponses);
      expect(result.consensusReached).toBe(false);
    });

    it('should handle unanimous agreement', () => {
      const result = majorityConsensus(allSameResponses);
      expect(result.consensusReached).toBe(true);
      expect(result.answer).toBe('Yes');
    });

    it('should identify the majority response in a varied set', () => {
      const result = majorityConsensus(moreVariedResponses);
      expect(result.consensusReached).toBe(false); // No > 50% majority
      expect(['Yes', 'No']).toContain(result.answer); // Either Yes or No could be returned as they're tied
    });
  });

  describe('supermajorityConsensus', () => {
    const supermajorityConsensus = getConsensusMethod('supermajority');

    // For testResponses (2/3 = 66.7%), this should NOT reach consensus with 75% threshold
    it('should not reach consensus when less than 75% agreement exists', () => {
      const result = supermajorityConsensus(testResponses);
      expect(result.consensusReached).toBe(false);
    });

    it('should reach consensus when unanimous agreement exists', () => {
      const result = supermajorityConsensus(allSameResponses);
      expect(result.consensusReached).toBe(true);
      expect(result.answer).toBe('Yes');
    });

    it('should reach consensus when exactly 75% agreement exists', () => {
      const seventyFivePercentResponses = [
        { model: 'model1', response: 'Yes' },
        { model: 'model2', response: 'Yes' },
        { model: 'model3', response: 'Yes' },
        { model: 'model4', response: 'No' },
      ];
      const result = supermajorityConsensus(seventyFivePercentResponses);
      expect(result.consensusReached).toBe(true);
      expect(result.answer).toBe('Yes');
    });

    it('should reach consensus when more than 75% agreement exists', () => {
      const eightyPercentResponses = [
        { model: 'model1', response: 'Yes' },
        { model: 'model2', response: 'Yes' },
        { model: 'model3', response: 'Yes' },
        { model: 'model4', response: 'Yes' },
        { model: 'model5', response: 'No' },
      ];
      const result = supermajorityConsensus(eightyPercentResponses);
      expect(result.consensusReached).toBe(true);
      expect(result.answer).toBe('Yes');
    });
  });

  describe('unanimousConsensus', () => {
    const unanimousConsensus = getConsensusMethod('unanimous');

    it('should not reach consensus when any disagreement exists', () => {
      const result = unanimousConsensus(testResponses);
      expect(result.consensusReached).toBe(false);
    });

    it('should reach consensus when all responses are the same', () => {
      const result = unanimousConsensus(allSameResponses);
      expect(result.consensusReached).toBe(true);
      expect(result.answer).toBe('Yes');
    });

    it('should not reach consensus in a varied response set', () => {
      const result = unanimousConsensus(moreVariedResponses);
      expect(result.consensusReached).toBe(false);
    });
  });

  describe('getConsensusMethod', () => {
    it('should return the correct method for each method name', () => {
      const majority = getConsensusMethod('majority');
      const supermajority = getConsensusMethod('supermajority');
      const unanimous = getConsensusMethod('unanimous');

      expect(majority).toBeDefined();
      expect(supermajority).toBeDefined();
      expect(unanimous).toBeDefined();

      // Test that each method returns different results for the same input
      const majorityResult = majority(testResponses);
      const supermajorityResult = supermajority(testResponses);
      const unanimousResult = unanimous(testResponses);

      expect(majorityResult.consensusReached).toBe(true);
      expect(supermajorityResult.consensusReached).toBe(false); // With 75% threshold, 2/3 is not enough
      expect(unanimousResult.consensusReached).toBe(false);
    });
  });
});
