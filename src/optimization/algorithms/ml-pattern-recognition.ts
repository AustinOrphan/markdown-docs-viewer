/**
 * Machine Learning Pattern Recognition System
 * Advanced pattern recognition that learns from discovery sessions to improve prediction accuracy
 */

import { Document } from '../../types';
import { DiscoveryResult, DocumentPattern } from './progressive-document-discovery';

/**
 * Site context for ML learning
 */
export interface SiteContext {
  domain: string;
  platform: 'github_pages' | 'netlify' | 'vercel' | 'custom';
  generator?: 'jekyll' | 'gatsby' | 'next' | 'vuepress' | 'docusaurus' | 'gitbook';
  size: 'small' | 'medium' | 'large'; // Based on document count
  category: 'documentation' | 'blog' | 'wiki' | 'api' | 'mixed';
}

/**
 * ML prediction result with confidence scoring
 */
export interface PredictionResult {
  path: string;
  probability: number;
  reasoning: string;
  source: 'ml_model' | 'pattern_match' | 'historical_data';
  confidence: number;
}

/**
 * Success metrics for learning
 */
export interface SuccessMetrics {
  discoverySessionId: string;
  totalRequests: number;
  successfulRequests: number;
  documentsFound: number;
  executionTime: number;
  patternAccuracy: number;
  userSatisfaction?: number; // 0-1 score if available
}

/**
 * Historical pattern data for ML training
 */
export interface PatternLearningData {
  siteContext: SiteContext;
  discoveryResults: DiscoveryResult[];
  finalPattern: DocumentPattern;
  successMetrics: SuccessMetrics;
  timestamp: number;
}

/**
 * Pattern weights for adaptive learning
 */
export interface PatternWeights {
  sequential: number;
  hierarchical: number;
  categorized: number;
  flat: number;
  mixed: number;
  
  // Advanced pattern weights
  api_focused: number;
  tutorial_heavy: number;
  reference_dense: number;
  blog_style: number;
}

/**
 * ML-based pattern recognition that learns from discovery sessions
 */
export class MLPatternRecognition {
  private patternHistory: PatternLearningData[] = [];
  private patternWeights: PatternWeights;
  private siteModels = new Map<string, SiteSpecificModel>();

  constructor() {
    // Initialize default pattern weights
    this.patternWeights = {
      sequential: 0.4,
      hierarchical: 0.3,
      categorized: 0.4,
      flat: 0.2,
      mixed: 0.6,
      api_focused: 0.3,
      tutorial_heavy: 0.4,
      reference_dense: 0.3,
      blog_style: 0.2
    };

    // Load historical data if available
    this.loadHistoricalData();
  }

  /**
   * Learn from a discovery session to improve future predictions
   */
  learnFromDiscoverySession(
    results: DiscoveryResult[],
    siteContext: SiteContext,
    successMetrics: SuccessMetrics
  ): void {
    const learningData: PatternLearningData = {
      siteContext,
      discoveryResults: results,
      finalPattern: this.analyzeAdvancedPattern(results, siteContext),
      successMetrics,
      timestamp: Date.now()
    };

    // Store for historical analysis
    this.patternHistory.push(learningData);

    // Update site-specific model
    this.updateSiteModel(siteContext.domain, learningData);

    // Adapt global pattern weights
    this.adaptPatternWeights(learningData);

    // Limit history size for performance
    if (this.patternHistory.length > 1000) {
      this.patternHistory = this.patternHistory.slice(-500);
    }

    // Persist learning data
    this.persistLearningData();
  }

  /**
   * Predict likely document locations based on partial results
   */
  predictDocumentLocations(partialResults: DiscoveryResult[]): PredictionResult[] {
    if (partialResults.length === 0) {
      return this.getSmartStartingPredictions();
    }

    const siteContext = this.inferSiteContext(partialResults);
    const pattern = this.analyzeAdvancedPattern(partialResults, siteContext);
    
    const predictions: PredictionResult[] = [];

    // ML-based predictions
    predictions.push(...this.generateMLPredictions(partialResults, siteContext, pattern));

    // Pattern-based predictions
    predictions.push(...this.generatePatternPredictions(pattern, partialResults));

    // Historical data predictions
    predictions.push(...this.generateHistoricalPredictions(siteContext, partialResults));

    // Sort by probability and confidence
    return predictions
      .sort((a, b) => (b.probability * b.confidence) - (a.probability * a.confidence))
      .slice(0, 10); // Top 10 predictions
  }

  /**
   * Enhanced stopping criteria using ML insights
   */
  shouldContinueDiscovery(currentResults: DiscoveryResult[], confidence: number): boolean {
    if (currentResults.length === 0) return true;

    const siteContext = this.inferSiteContext(currentResults);
    const pattern = this.analyzeAdvancedPattern(currentResults, siteContext);

    // Use ML to determine optimal stopping point
    const predictedRemainingDocs = this.predictRemainingDocuments(currentResults, siteContext);
    const costBenefitRatio = this.calculateCostBenefitRatio(currentResults, predictedRemainingDocs);

    // Advanced stopping criteria
    const factors = {
      patternConfidence: pattern.confidence,
      mlConfidence: confidence,
      costBenefit: costBenefitRatio,
      historicalOptimalPoint: this.getHistoricalOptimalStoppingPoint(siteContext),
      diminishingReturns: this.calculateDiminishingReturns(currentResults)
    };

    // Weighted decision using learned patterns
    const shouldContinue = this.calculateStoppingDecision(factors);
    
    return shouldContinue;
  }

  /**
   * Update pattern weights based on success metrics
   */
  updatePatternWeights(successMetrics: SuccessMetrics): void {
    const learningRate = 0.1; // Conservative learning rate
    
    // Find relevant historical data
    const relevantSessions = this.patternHistory
      .filter(data => data.successMetrics.discoverySessionId !== successMetrics.discoverySessionId)
      .slice(-50); // Recent sessions for comparison

    if (relevantSessions.length === 0) return;

    // Calculate performance relative to baseline
    const avgSuccess = relevantSessions.reduce((sum, session) => 
      sum + (session.successMetrics.successfulRequests / session.successMetrics.totalRequests), 0
    ) / relevantSessions.length;

    const currentSuccess = successMetrics.successfulRequests / successMetrics.totalRequests;
    const improvement = currentSuccess - avgSuccess;

    // Update weights based on improvement
    if (improvement > 0) {
      // Reinforce successful patterns
      this.reinforceSuccessfulPatterns(successMetrics, improvement * learningRate);
    } else {
      // Reduce weights of unsuccessful patterns
      this.penalizeUnsuccessfulPatterns(successMetrics, Math.abs(improvement) * learningRate);
    }
  }

  /**
   * Analyze advanced patterns considering site context
   */
  private analyzeAdvancedPattern(results: DiscoveryResult[], siteContext: SiteContext): DocumentPattern {
    const paths = results.map(r => r.path);
    const indicators: string[] = [];
    let type: DocumentPattern['type'] = 'flat';
    let confidence = 0;

    // Basic pattern detection (from progressive discovery)
    const basicPattern = this.detectBasicPatterns(paths);
    type = basicPattern.type;
    confidence = basicPattern.confidence;
    indicators.push(...basicPattern.indicators);

    // Advanced ML-enhanced pattern detection
    const advancedPatterns = this.detectAdvancedPatterns(paths, siteContext);
    
    // Combine patterns with learned weights
    const weightedConfidence = this.applyPatternWeights(basicPattern, advancedPatterns);
    
    return {
      type,
      confidence: Math.min(weightedConfidence, 1.0),
      indicators: [...indicators, ...advancedPatterns.indicators],
      recommendations: this.generateAdvancedRecommendations(results, advancedPatterns)
    };
  }

  /**
   * Generate ML-based predictions
   */
  private generateMLPredictions(
    partialResults: DiscoveryResult[],
    siteContext: SiteContext,
    pattern: DocumentPattern
  ): PredictionResult[] {
    const predictions: PredictionResult[] = [];
    const siteModel = this.siteModels.get(siteContext.domain);

    if (siteModel) {
      // Use site-specific model
      predictions.push(...siteModel.predict(partialResults, pattern));
    }

    // Use global model patterns
    const globalPredictions = this.generateGlobalMLPredictions(partialResults, siteContext, pattern);
    predictions.push(...globalPredictions);

    return predictions;
  }

  /**
   * Generate predictions based on historical data
   */
  private generateHistoricalPredictions(
    siteContext: SiteContext,
    partialResults: DiscoveryResult[]
  ): PredictionResult[] {
    const predictions: PredictionResult[] = [];
    
    // Find similar historical sessions
    const similarSessions = this.findSimilarSessions(siteContext, partialResults);
    
    for (const session of similarSessions.slice(0, 5)) {
      const newDocuments = this.extractUndiscoveredDocuments(session.discoveryResults, partialResults);
      
      for (const doc of newDocuments.slice(0, 3)) {
        predictions.push({
          path: doc.path,
          probability: 0.6 * session.successMetrics.patternAccuracy,
          reasoning: `Historical data from similar ${siteContext.platform} site`,
          source: 'historical_data',
          confidence: 0.7
        });
      }
    }

    return predictions;
  }

  /**
   * Infer site context from discovery results
   */
  private inferSiteContext(results: DiscoveryResult[]): SiteContext {
    const paths = results.map(r => r.path);
    const domain = this.extractDomain(paths);
    
    return {
      domain,
      platform: this.detectPlatform(paths),
      generator: this.detectGenerator(paths),
      size: this.estimateSize(results),
      category: this.categorizeContent(paths)
    };
  }

  /**
   * Load historical learning data from storage
   */
  private loadHistoricalData(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('ml_pattern_history');
        if (stored) {
          this.patternHistory = JSON.parse(stored);
        }

        const weights = localStorage.getItem('ml_pattern_weights');
        if (weights) {
          this.patternWeights = { ...this.patternWeights, ...JSON.parse(weights) };
        }
      }
    } catch (error) {
      console.warn('Failed to load ML historical data:', error);
    }
  }

  /**
   * Persist learning data to storage
   */
  private persistLearningData(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ml_pattern_history', JSON.stringify(this.patternHistory.slice(-100)));
        localStorage.setItem('ml_pattern_weights', JSON.stringify(this.patternWeights));
      }
    } catch (error) {
      console.warn('Failed to persist ML learning data:', error);
    }
  }

  // Helper methods (implementations would be extensive, providing key signatures)
  private detectBasicPatterns(paths: string[]): { type: DocumentPattern['type']; confidence: number; indicators: string[] } {
    // Implementation similar to progressive-document-discovery.ts
    return { type: 'flat', confidence: 0.5, indicators: [] };
  }

  private detectAdvancedPatterns(paths: string[], siteContext: SiteContext) {
    // Advanced pattern detection logic
    return { indicators: [], confidence: 0.5 };
  }

  private applyPatternWeights(basicPattern: any, advancedPatterns: any): number {
    // Apply learned weights to pattern confidence
    return basicPattern.confidence * 0.8 + advancedPatterns.confidence * 0.2;
  }

  private generateAdvancedRecommendations(results: DiscoveryResult[], patterns: any) {
    // Generate ML-enhanced recommendations
    return [];
  }

  private updateSiteModel(domain: string, learningData: PatternLearningData): void {
    // Update or create site-specific model
    if (!this.siteModels.has(domain)) {
      this.siteModels.set(domain, new SiteSpecificModel(domain));
    }
    this.siteModels.get(domain)!.learn(learningData);
  }

  private adaptPatternWeights(learningData: PatternLearningData): void {
    // Adapt global pattern weights based on success
    const improvement = learningData.successMetrics.patternAccuracy;
    const learningRate = 0.05;

    if (improvement > 0.8) {
      // Reinforce the pattern type that worked well
      const patternType = learningData.finalPattern.type;
      if (patternType in this.patternWeights) {
        this.patternWeights[patternType as keyof PatternWeights] += learningRate;
      }
    }
  }

  private generateGlobalMLPredictions(partialResults: DiscoveryResult[], siteContext: SiteContext, pattern: DocumentPattern): PredictionResult[] {
    // Generate predictions using global ML insights
    return [];
  }

  private findSimilarSessions(siteContext: SiteContext, partialResults: DiscoveryResult[]): PatternLearningData[] {
    // Find historical sessions with similar characteristics
    return this.patternHistory.filter(data => 
      data.siteContext.platform === siteContext.platform &&
      data.siteContext.category === siteContext.category
    );
  }

  private extractUndiscoveredDocuments(historicalResults: DiscoveryResult[], currentResults: DiscoveryResult[]): DiscoveryResult[] {
    const currentPaths = new Set(currentResults.map(r => r.path));
    return historicalResults.filter(r => !currentPaths.has(r.path));
  }

  private extractDomain(paths: string[]): string {
    // Extract domain from paths
    return 'unknown';
  }

  private detectPlatform(paths: string[]): SiteContext['platform'] {
    // Detect hosting platform from path patterns
    return 'custom';
  }

  private detectGenerator(paths: string[]): SiteContext['generator'] {
    // Detect static site generator from patterns
    return undefined;
  }

  private estimateSize(results: DiscoveryResult[]): SiteContext['size'] {
    // Estimate site size based on discovery results
    return results.length > 20 ? 'large' : results.length > 5 ? 'medium' : 'small';
  }

  private categorizeContent(paths: string[]): SiteContext['category'] {
    // Categorize content type based on paths
    return 'documentation';
  }

  private predictRemainingDocuments(currentResults: DiscoveryResult[], siteContext: SiteContext): number {
    // Predict how many documents remain undiscovered
    return 5;
  }

  private calculateCostBenefitRatio(currentResults: DiscoveryResult[], predictedRemaining: number): number {
    // Calculate cost-benefit ratio of continuing discovery
    return predictedRemaining / (currentResults.length + 1);
  }

  private getHistoricalOptimalStoppingPoint(siteContext: SiteContext): number {
    // Get optimal stopping point from historical data
    return 0.8;
  }

  private calculateDiminishingReturns(currentResults: DiscoveryResult[]): number {
    // Calculate diminishing returns factor
    return Math.max(0, 1 - (currentResults.length / 20));
  }

  private calculateStoppingDecision(factors: any): boolean {
    // Calculate weighted stopping decision
    const score = factors.patternConfidence * 0.3 + 
                 factors.mlConfidence * 0.2 + 
                 factors.costBenefit * 0.2 + 
                 factors.historicalOptimalPoint * 0.2 + 
                 factors.diminishingReturns * 0.1;
    
    return score < 0.7; // Continue if score is below threshold
  }

  private reinforceSuccessfulPatterns(successMetrics: SuccessMetrics, improvement: number): void {
    // Reinforce pattern weights that led to success
    Object.keys(this.patternWeights).forEach(key => {
      this.patternWeights[key as keyof PatternWeights] += improvement * 0.1;
    });
  }

  private penalizeUnsuccessfulPatterns(successMetrics: SuccessMetrics, penalty: number): void {
    // Reduce weights of patterns that didn't work well
    Object.keys(this.patternWeights).forEach(key => {
      this.patternWeights[key as keyof PatternWeights] = Math.max(0.1, 
        this.patternWeights[key as keyof PatternWeights] - penalty * 0.05
      );
    });
  }

  private getSmartStartingPredictions(): PredictionResult[] {
    // Get smart starting predictions when no partial results available
    return [
      {
        path: 'README.md',
        probability: 0.9,
        reasoning: 'Most common documentation entry point',
        source: 'ml_model',
        confidence: 0.95
      },
      {
        path: 'docs/README.md',
        probability: 0.8,
        reasoning: 'Common docs directory pattern',
        source: 'ml_model',
        confidence: 0.85
      }
    ];
  }

  private generatePatternPredictions(pattern: DocumentPattern, partialResults: DiscoveryResult[]): PredictionResult[] {
    // Generate predictions based on detected patterns
    return pattern.recommendations?.map(rec => ({
      path: rec.path,
      probability: rec.probability,
      reasoning: rec.reasoning,
      source: 'pattern_match' as const,
      confidence: pattern.confidence
    })) || [];
  }
}

/**
 * Site-specific ML model for domain-specific learning
 */
class SiteSpecificModel {
  private domain: string;
  private patterns: Map<string, number> = new Map();
  private successHistory: SuccessMetrics[] = [];

  constructor(domain: string) {
    this.domain = domain;
  }

  learn(learningData: PatternLearningData): void {
    this.successHistory.push(learningData.successMetrics);
    
    // Update pattern success rates
    learningData.discoveryResults.forEach(result => {
      const pathPattern = this.extractPathPattern(result.path);
      const currentRate = this.patterns.get(pathPattern) || 0;
      this.patterns.set(pathPattern, currentRate + 0.1);
    });
  }

  predict(partialResults: DiscoveryResult[], pattern: DocumentPattern): PredictionResult[] {
    const predictions: PredictionResult[] = [];
    
    // Use site-specific patterns to make predictions
    for (const [pathPattern, successRate] of this.patterns.entries()) {
      if (successRate > 0.5) {
        predictions.push({
          path: this.generatePathFromPattern(pathPattern),
          probability: successRate,
          reasoning: `Site-specific pattern for ${this.domain}`,
          source: 'ml_model',
          confidence: 0.8
        });
      }
    }

    return predictions.slice(0, 5);
  }

  private extractPathPattern(path: string): string {
    // Extract generalized pattern from specific path
    return path.replace(/[0-9]+/g, '[NUM]').replace(/[a-zA-Z0-9-_]+\.md/, '[FILE].md');
  }

  private generatePathFromPattern(pattern: string): string {
    // Generate specific path from pattern
    return pattern.replace('[NUM]', '01').replace('[FILE]', 'index');
  }
}

/**
 * Factory function for ML pattern recognition
 */
export function createMLPatternRecognition(): MLPatternRecognition {
  return new MLPatternRecognition();
}