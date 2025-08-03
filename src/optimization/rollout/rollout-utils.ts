/**
 * Week 3 Rollout Utilities
 * 
 * Helper utilities for rollout management, statistical analysis,
 * user targeting, and configuration validation.
 */

import { AgentCRolloutConfig, RolloutStatus } from './agent-c-integration';
import { ABTestExperiment, RolloutPhase } from './production-rollout';

export interface RolloutValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface StatisticalTestResult {
  pValue: number;
  statisticallySignificant: boolean;
  confidenceInterval: [number, number];
  effectSize: number;
  sampleSizeAdequate: boolean;
}

/**
 * Rollout utilities for configuration, validation, and statistical analysis
 */
export class RolloutUtils {
  /**
   * Validate rollout configuration
   */
  static validateRolloutConfig(config: AgentCRolloutConfig): RolloutValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate success criteria
    if (config.successCriteria.requestReductionTarget < 50 || config.successCriteria.requestReductionTarget > 95) {
      warnings.push('Request reduction target should be between 50-95% for realistic expectations');
    }

    if (config.successCriteria.initializationTimeTarget < 500) {
      warnings.push('Initialization time target below 500ms may be too aggressive');
    }

    if (config.successCriteria.errorRateThreshold > 5.0) {
      errors.push('Error rate threshold above 5% is too high for production');
    }

    // Validate rollback triggers
    if (!config.rollbackTriggers.autoRollbackEnabled) {
      warnings.push('Consider enabling auto-rollback for production safety');
    }

    if (config.rollbackTriggers.rollbackCooldownPeriod < 60 * 60 * 1000) {
      warnings.push('Rollback cooldown period should be at least 1 hour');
    }

    // Validate A/B testing configuration
    if (config.abTesting.enabled) {
      if (config.abTesting.sampleSize < 100) {
        errors.push('A/B test sample size should be at least 100 users per cohort');
      }

      if (config.abTesting.confidenceLevel < 0.8 || config.abTesting.confidenceLevel > 0.99) {
        warnings.push('Confidence level should be between 80-99%');
      }

      if (config.abTesting.testDuration < 24 * 60 * 60 * 1000) {
        warnings.push('A/B test duration should be at least 24 hours for reliable results');
      }
    }

    // Validate monitoring configuration
    if (config.monitoring.reportingInterval < 30000) {
      warnings.push('Monitoring interval below 30 seconds may cause performance overhead');
    }

    // Generate recommendations
    if (config.strategy === 'aggressive') {
      recommendations.push('Consider using "moderate" strategy for first production rollout');
    }

    if (config.successCriteria.requestReductionTarget > 85) {
      recommendations.push('Set progressive targets: start with 70%, then increase to 85%+');
    }

    if (!config.monitoring.alertingEnabled) {
      recommendations.push('Enable alerting for production monitoring');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }

  /**
   * Calculate statistical significance for A/B test
   */
  static calculateStatisticalSignificance(
    controlMetrics: { users: number; metric: number; variance: number },
    treatmentMetrics: { users: number; metric: number; variance: number },
    confidenceLevel: number = 0.95
  ): StatisticalTestResult {
    const { users: n1, metric: mean1, variance: var1 } = controlMetrics;
    const { users: n2, metric: mean2, variance: var2 } = treatmentMetrics;

    // Calculate pooled standard error
    const pooledSE = Math.sqrt((var1 / n1) + (var2 / n2));
    
    // Calculate t-statistic
    const tStat = Math.abs(mean2 - mean1) / pooledSE;
    
    // Calculate degrees of freedom (Welch's t-test approximation)
    const df = Math.pow((var1/n1) + (var2/n2), 2) / 
               (Math.pow(var1/n1, 2)/(n1-1) + Math.pow(var2/n2, 2)/(n2-1));
    
    // Calculate p-value (simplified approximation)
    const pValue = this.calculatePValue(tStat, df);
    
    // Check statistical significance
    const alpha = 1 - confidenceLevel;
    const statisticallySignificant = pValue < alpha;
    
    // Calculate confidence interval
    const criticalValue = this.getCriticalValue(alpha/2, df);
    const marginOfError = criticalValue * pooledSE;
    const meanDiff = mean2 - mean1;
    const confidenceInterval: [number, number] = [
      meanDiff - marginOfError,
      meanDiff + marginOfError
    ];
    
    // Calculate effect size (Cohen's d)
    const pooledSD = Math.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2));
    const effectSize = Math.abs(mean2 - mean1) / pooledSD;
    
    // Check if sample size is adequate (power analysis)
    const sampleSizeAdequate = this.checkSampleSizeAdequacy(effectSize, alpha, 0.8, n1, n2);

    return {
      pValue,
      statisticallySignificant,
      confidenceInterval,
      effectSize,
      sampleSizeAdequate,
    };
  }

  /**
   * Generate consistent user hash for targeting
   */
  static generateUserHash(userId?: string): number {
    // Use user ID if available, otherwise use browser fingerprint
    const identifier = userId || this.generateBrowserFingerprint();
    
    // Simple hash function (djb2)
    let hash = 5381;
    for (let i = 0; i < identifier.length; i++) {
      hash = ((hash << 5) + hash) + identifier.charCodeAt(i);
    }
    
    // Ensure positive number between 0-99
    return Math.abs(hash) % 100;
  }

  /**
   * Determine optimal rollout phases based on risk tolerance
   */
  static generateOptimalPhases(
    strategy: 'conservative' | 'moderate' | 'aggressive',
    targetUsers: number
  ): RolloutPhase[] {
    const basePhases = this.getBasePhaseTemplate(strategy);
    
    // Adjust phase sizes based on target user base
    if (targetUsers < 1000) {
      // Small user base - use fewer, larger phases
      return basePhases.filter((_, index) => index % 2 === 0);
    } else if (targetUsers > 100000) {
      // Large user base - add more granular phases
      return this.addGranularPhases(basePhases);
    }
    
    return basePhases;
  }

  /**
   * Calculate rollout risk score
   */
  static calculateRiskScore(status: RolloutStatus): {
    score: number; // 0-100 (lower is better)
    factors: Array<{ factor: string; impact: number; description: string }>;
    recommendation: 'low-risk' | 'medium-risk' | 'high-risk' | 'critical-risk';
  } {
    const factors: Array<{ factor: string; impact: number; description: string }> = [];
    let totalScore = 0;

    // Error rate factor (0-30 points)
    const errorImpact = Math.min(status.metrics.errorRate * 6, 30);
    factors.push({
      factor: 'Error Rate',
      impact: errorImpact,
      description: `${status.metrics.errorRate.toFixed(1)}% error rate`,
    });
    totalScore += errorImpact;

    // Performance regression factor (0-25 points)
    const baselinePerformance = 1500; // ms
    const regressionPercent = Math.max(0, (status.metrics.initializationTime - baselinePerformance) / baselinePerformance * 100);
    const performanceImpact = Math.min(regressionPercent * 2.5, 25);
    factors.push({
      factor: 'Performance Regression',
      impact: performanceImpact,
      description: `${regressionPercent.toFixed(1)}% slower than baseline`,
    });
    totalScore += performanceImpact;

    // User satisfaction factor (0-20 points)
    const satisfactionImpact = Math.max(0, (90 - status.metrics.userSatisfaction) * 0.5);
    factors.push({
      factor: 'User Satisfaction',
      impact: satisfactionImpact,
      description: `${status.metrics.userSatisfaction.toFixed(1)}% satisfaction score`,
    });
    totalScore += satisfactionImpact;

    // Alert severity factor (0-15 points)
    const criticalAlerts = status.alerts.filter(a => a.severity === 'critical').length;
    const errorAlerts = status.alerts.filter(a => a.severity === 'error').length;
    const alertImpact = criticalAlerts * 10 + errorAlerts * 3;
    factors.push({
      factor: 'Active Alerts',
      impact: Math.min(alertImpact, 15),
      description: `${criticalAlerts} critical, ${errorAlerts} error alerts`,
    });
    totalScore += Math.min(alertImpact, 15);

    // Rollout speed factor (0-10 points)
    const speedImpact = status.progress.overallPercentage > 50 ? Math.min((status.progress.overallPercentage - 50) * 0.2, 10) : 0;
    factors.push({
      factor: 'Rollout Speed',
      impact: speedImpact,
      description: `${status.progress.overallPercentage.toFixed(1)}% completion`,
    });
    totalScore += speedImpact;

    // Determine recommendation
    let recommendation: 'low-risk' | 'medium-risk' | 'high-risk' | 'critical-risk';
    if (totalScore < 20) {
      recommendation = 'low-risk';
    } else if (totalScore < 40) {
      recommendation = 'medium-risk';
    } else if (totalScore < 70) {
      recommendation = 'high-risk';
    } else {
      recommendation = 'critical-risk';
    }

    return {
      score: Math.min(totalScore, 100),
      factors,
      recommendation,
    };
  }

  /**
   * Predict rollout success probability
   */
  static predictRolloutSuccess(
    currentMetrics: RolloutStatus['metrics'],
    targetMetrics: AgentCRolloutConfig['successCriteria'],
    currentProgress: number
  ): {
    probability: number; // 0-1
    confidence: number; // 0-1
    keyFactors: string[];
    recommendation: string;
  } {
    let successScore = 0;
    let maxScore = 0;
    const keyFactors: string[] = [];

    // Request reduction success factor
    const requestScore = currentMetrics.requestReduction / targetMetrics.requestReductionTarget;
    successScore += Math.min(requestScore, 1) * 25;
    maxScore += 25;
    if (requestScore < 0.8) {
      keyFactors.push(`Request reduction below target (${currentMetrics.requestReduction.toFixed(1)}% vs ${targetMetrics.requestReductionTarget}%)`);
    }

    // Performance success factor
    const perfScore = targetMetrics.initializationTimeTarget / Math.max(currentMetrics.initializationTime, 1);
    successScore += Math.min(perfScore, 1) * 20;
    maxScore += 20;
    if (perfScore < 0.8) {
      keyFactors.push(`Initialization time above target (${currentMetrics.initializationTime}ms vs ${targetMetrics.initializationTimeTarget}ms)`);
    }

    // Cache effectiveness factor
    const cacheScore = currentMetrics.cacheHitRate / targetMetrics.cacheHitRateTarget;
    successScore += Math.min(cacheScore, 1) * 20;
    maxScore += 20;
    if (cacheScore < 0.8) {
      keyFactors.push(`Cache hit rate below target (${currentMetrics.cacheHitRate.toFixed(1)}% vs ${targetMetrics.cacheHitRateTarget}%)`);
    }

    // Error rate factor (inverted)
    const errorScore = Math.max(0, 1 - (currentMetrics.errorRate / targetMetrics.errorRateThreshold));
    successScore += errorScore * 20;
    maxScore += 20;
    if (currentMetrics.errorRate > targetMetrics.errorRateThreshold * 0.5) {
      keyFactors.push(`Error rate concerning (${currentMetrics.errorRate.toFixed(1)}% vs ${targetMetrics.errorRateThreshold}% threshold)`);
    }

    // User satisfaction factor
    const userScore = currentMetrics.userSatisfaction / targetMetrics.userSatisfactionTarget;
    successScore += Math.min(userScore, 1) * 15;
    maxScore += 15;
    if (userScore < 0.8) {
      keyFactors.push(`User satisfaction below target (${currentMetrics.userSatisfaction.toFixed(1)}% vs ${targetMetrics.userSatisfactionTarget}%)`);
    }

    const probability = maxScore > 0 ? successScore / maxScore : 0;
    
    // Calculate confidence based on progress and metric stability
    const progressFactor = Math.min(currentProgress / 50, 1); // More confidence as rollout progresses
    const metricStability = keyFactors.length === 0 ? 1 : Math.max(0.3, 1 - (keyFactors.length * 0.2));
    const confidence = (progressFactor + metricStability) / 2;

    // Generate recommendation
    let recommendation: string;
    if (probability > 0.8 && confidence > 0.7) {
      recommendation = 'Proceed with confidence - all metrics indicate high success probability';
    } else if (probability > 0.6 && confidence > 0.5) {
      recommendation = 'Proceed with caution - monitor key metrics closely';
    } else if (probability > 0.4) {
      recommendation = 'Consider pausing to address performance issues before continuing';
    } else {
      recommendation = 'High risk of failure - recommend rollback or significant optimization';
    }

    return {
      probability,
      confidence,
      keyFactors,
      recommendation,
    };
  }

  // Private helper methods
  private static calculatePValue(tStat: number, df: number): number {
    // Simplified p-value calculation using normal approximation
    // In production, would use more accurate statistical libraries
    const z = tStat;
    return 2 * (1 - this.normalCDF(Math.abs(z)));
  }

  private static normalCDF(x: number): number {
    // Approximation of the cumulative distribution function for standard normal
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private static erf(x: number): number {
    // Approximation of the error function
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

  private static getCriticalValue(alpha: number, df: number): number {
    // Simplified critical value lookup - in production would use statistical tables
    // For large df, approaches normal distribution
    if (df > 30) {
      return alpha < 0.01 ? 2.576 : alpha < 0.025 ? 1.96 : 1.645;
    }
    // Rough approximation for smaller df
    return alpha < 0.01 ? 3.0 : alpha < 0.025 ? 2.2 : 1.8;
  }

  private static checkSampleSizeAdequacy(
    effectSize: number,
    alpha: number,
    power: number,
    n1: number,
    n2: number
  ): boolean {
    // Simplified power analysis - check if sample size is adequate for detecting effect
    const requiredN = this.calculateRequiredSampleSize(effectSize, alpha, power);
    return Math.min(n1, n2) >= requiredN;
  }

  private static calculateRequiredSampleSize(
    effectSize: number,
    alpha: number,
    power: number
  ): number {
    // Simplified sample size calculation
    // In production, would use more sophisticated power analysis
    const zAlpha = alpha < 0.01 ? 2.576 : alpha < 0.05 ? 1.96 : 1.645;
    const zBeta = power > 0.9 ? 1.28 : power > 0.8 ? 0.84 : 0.67;
    
    return Math.ceil(2 * Math.pow(zAlpha + zBeta, 2) / Math.pow(effectSize, 2));
  }

  private static generateBrowserFingerprint(): string {
    // Generate a simple browser fingerprint for user targeting
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
    ];
    
    return components.join('|');
  }

  private static getBasePhaseTemplate(strategy: 'conservative' | 'moderate' | 'aggressive'): RolloutPhase[] {
    // This would return appropriate phase templates based on strategy
    // Implementation would depend on specific requirements
    return [];
  }

  private static addGranularPhases(basePhases: RolloutPhase[]): RolloutPhase[] {
    // Add more granular phases for large user bases
    // Implementation would create intermediate phases
    return basePhases;
  }
}

/**
 * Quick utility functions
 */
export function calculateStatisticalSignificance(
  controlMetrics: { users: number; metric: number; variance: number },
  treatmentMetrics: { users: number; metric: number; variance: number },
  confidenceLevel?: number
) {
  return RolloutUtils.calculateStatisticalSignificance(controlMetrics, treatmentMetrics, confidenceLevel);
}

export function generateUserHash(userId?: string): number {
  return RolloutUtils.generateUserHash(userId);
}

export function validateRolloutConfig(config: AgentCRolloutConfig): RolloutValidationResult {
  return RolloutUtils.validateRolloutConfig(config);
}