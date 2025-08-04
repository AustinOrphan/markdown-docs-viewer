/**
 * A/B Testing Framework for Production Rollout
 * 
 * Provides statistical A/B testing capabilities for the gradual rollout system.
 * Supports user assignment, variant distribution, and result analysis.
 */

export interface ABTestConfig {
  name: string;
  controlVariant: string;
  treatmentVariants: string[];
  rolloutPercentage: number;
  targetCohorts?: string[];
  description?: string;
  duration?: number;
  sampleSize?: number;
}

export interface ABTestResult {
  testName: string;
  variant: string;
  metrics: Record<string, number>;
  timestamp: number;
}

export interface ABTestMetrics {
  conversionRate: number;
  errorRate: number;
  performanceMetrics: {
    requestReduction: number;
    initializationTime: number;
    cacheHitRate: number;
  };
  userSatisfaction: number;
}

export interface StatisticalAnalysis {
  testName: string;
  confidence: number;
  pValue: number;
  significanceLevel: number;
  winningVariant: string | null;
  recommendedAction: 'continue' | 'rollout' | 'rollback';
}

/**
 * A/B Testing Framework for optimization rollouts
 */
export class ABTestFramework {
  private activeTests: Map<string, ABTestConfig> = new Map();
  private testResults: ABTestResult[] = [];
  private userAssignments: Map<string, Map<string, string>> = new Map();

  /**
   * Start a new A/B test
   */
  startTest(config: ABTestConfig): void {
    this.activeTests.set(config.name, config);
  }

  /**
   * Get variant assignment for a user
   */
  getVariantForUser(testName: string, userId: string): string {
    const test = this.activeTests.get(testName);
    if (!test) return 'control';

    // Check existing assignment
    const userTests = this.userAssignments.get(userId);
    if (userTests?.has(testName)) {
      return userTests.get(testName)!;
    }

    // Generate new assignment
    const hash = this.hashString(`${userId}-${testName}`);
    const bucket = hash % 100;
    
    let variant = test.controlVariant;
    if (bucket < test.rolloutPercentage) {
      // Simple round-robin for treatment variants
      const treatmentIndex = hash % test.treatmentVariants.length;
      variant = test.treatmentVariants[treatmentIndex] || test.controlVariant;
    }

    // Store assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }
    this.userAssignments.get(userId)!.set(testName, variant);

    return variant;
  }

  /**
   * Record metrics for a test variant
   */
  recordMetric(testName: string, variant: string, metric: string, value: number): void {
    this.testResults.push({
      testName,
      variant,
      metrics: { [metric]: value },
      timestamp: Date.now()
    });
  }

  /**
   * Get results for a specific test
   */
  getTestResults(testName: string): ABTestResult[] {
    return this.testResults.filter(result => result.testName === testName);
  }

  /**
   * Stop a test and clean up
   */
  stopTest(testName: string): void {
    this.activeTests.delete(testName);
    // Keep results for analysis
  }

  /**
   * Hash string for consistent user assignment
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Create a new A/B test configuration
 */
export function createABTest(config: Partial<ABTestConfig> & { name: string }): ABTestConfig {
  return {
    controlVariant: 'control',
    treatmentVariants: ['treatment'],
    rolloutPercentage: 50,
    targetCohorts: [],
    ...config
  };
}

/**
 * Analyze A/B test results for statistical significance
 */
export function analyzeABTestResults(
  testName: string,
  controlMetrics: ABTestMetrics,
  treatmentMetrics: ABTestMetrics,
  sampleSize: { control: number; treatment: number }
): StatisticalAnalysis {
  // Simple statistical analysis
  const controlConversion = controlMetrics.conversionRate;
  const treatmentConversion = treatmentMetrics.conversionRate;
  
  // Z-test for proportions (simplified)
  const pooledProportion = (
    (controlConversion * sampleSize.control) + 
    (treatmentConversion * sampleSize.treatment)
  ) / (sampleSize.control + sampleSize.treatment);
  
  const standardError = Math.sqrt(
    pooledProportion * (1 - pooledProportion) * 
    (1 / sampleSize.control + 1 / sampleSize.treatment)
  );
  
  const zScore = Math.abs(treatmentConversion - controlConversion) / standardError;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  
  const significanceLevel = 0.05;
  const confidence = (1 - pValue) * 100;
  
  let winningVariant: string | null = null;
  let recommendedAction: 'continue' | 'rollout' | 'rollback' = 'continue';
  
  if (pValue < significanceLevel) {
    winningVariant = treatmentConversion > controlConversion ? 'treatment' : 'control';
    recommendedAction = winningVariant === 'treatment' ? 'rollout' : 'rollback';
  }
  
  return {
    testName,
    confidence,
    pValue,
    significanceLevel,
    winningVariant,
    recommendedAction
  };
}

/**
 * Standard normal cumulative distribution function (approximation)
 */
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Error function approximation
 */
function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Singleton instance for global access
let globalABTestFramework: ABTestFramework | null = null;

/**
 * Get global A/B testing framework instance
 */
export function getGlobalABTestFramework(): ABTestFramework {
  if (!globalABTestFramework) {
    globalABTestFramework = new ABTestFramework();
  }
  return globalABTestFramework;
}

/**
 * Reset global A/B testing framework
 */
export function resetGlobalABTestFramework(): void {
  globalABTestFramework = null;
}

// Type alias for backwards compatibility
export { ABTestFramework as ABTestingFramework };