/**
 * Predictive Document Loading System
 * Preloads likely documents based on user navigation patterns and ML predictions
 */

import { Document } from '../../types';
import { DiscoveryResult } from './progressive-document-discovery';
import { PredictionResult, MLPatternRecognition } from './ml-pattern-recognition';

/**
 * Navigation history for prediction
 */
export interface NavigationHistory {
  path: string[];
  timestamps: number[];
  dwellTimes: number[];
  source: 'click' | 'search' | 'direct' | 'breadcrumb';
}

/**
 * Prefetch strategy configuration
 */
export interface PrefetchStrategy {
  triggerThreshold: number; // Start prefetching when confidence > threshold
  maxConcurrent: number; // Max concurrent prefetch requests
  mobileOptimized: boolean; // Reduce prefetching on mobile
  networkAware: boolean; // Adapt to network conditions
  priorityBased: boolean; // Use priority-based loading
}

/**
 * Network conditions for adaptive prefetching
 */
export interface NetworkConditions {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  downlink: number; // Mbps
  rtt: number; // Round trip time in ms
  saveData: boolean; // User preference for data saving
}

/**
 * Prefetch queue item
 */
interface PrefetchItem {
  document: Document;
  priority: 'high' | 'medium' | 'low';
  prediction: PredictionResult;
  addedAt: number;
  attempts: number;
}

/**
 * Predictive loading analytics
 */
export interface PredictiveLoadingAnalytics {
  totalPredictions: number;
  accuratePredictions: number;
  prefetchHitRate: number;
  bandwidthSaved: number;
  userExperienceImprovement: number;
}

/**
 * Predictive Document Loading implementation
 */
export class PredictiveDocumentLoading {
  private strategy: PrefetchStrategy;
  private mlRecognition: MLPatternRecognition;
  private prefetchQueue: Map<string, PrefetchItem> = new Map();
  private prefetchCache: Map<string, Document> = new Map();
  private navigationHistory: NavigationHistory[] = [];
  private analytics: PredictiveLoadingAnalytics;
  private isPreloading = false;
  private networkConditions: NetworkConditions | null = null;

  constructor(
    strategy: Partial<PrefetchStrategy> = {},
    mlRecognition: MLPatternRecognition
  ) {
    this.strategy = {
      triggerThreshold: 0.7,
      maxConcurrent: 3,
      mobileOptimized: true,
      networkAware: true,
      priorityBased: true,
      ...strategy
    };

    this.mlRecognition = mlRecognition;
    this.analytics = {
      totalPredictions: 0,
      accuratePredictions: 0,
      prefetchHitRate: 0,
      bandwidthSaved: 0,
      userExperienceImprovement: 0
    };

    this.initializeNetworkMonitoring();
    this.startBackgroundPrefetching();
  }

  /**
   * Predict next documents based on current document and navigation history
   */
  predictNextDocuments(currentDoc: Document, history: NavigationHistory): Document[] {
    this.analytics.totalPredictions++;

    // Use ML pattern recognition for predictions
    const currentResults: DiscoveryResult[] = [{
      document: currentDoc,
      path: currentDoc.file || currentDoc.id,
      source: 'smart-start',
      confidence: 1.0,
      requestOrder: 0
    }];

    const mlPredictions = this.mlRecognition.predictDocumentLocations(currentResults);

    // Combine with navigation pattern predictions
    const navigationPredictions = this.predictFromNavigationPatterns(currentDoc, history);

    // Merge and prioritize predictions
    const allPredictions = [...mlPredictions, ...navigationPredictions];
    const uniquePredictions = this.deduplicatePredictions(allPredictions);

    // Filter by confidence threshold
    const highConfidencePredictions = uniquePredictions.filter(
      pred => pred.confidence >= this.strategy.triggerThreshold
    );

    // Convert predictions to documents (would need actual document resolution)
    return this.convertPredictionsToDocuments(highConfidencePredictions);
  }

  /**
   * Preload documents based on predictions
   */
  async preloadDocuments(
    predictions: Document[],
    priority: 'high' | 'medium' | 'low'
  ): Promise<void> {
    if (!this.shouldPreload()) {
      return;
    }

    // Add to prefetch queue
    for (const doc of predictions) {
      if (!this.prefetchQueue.has(doc.file || doc.id) && !this.prefetchCache.has(doc.file || doc.id)) {
        const predictionResult = this.findPredictionForDocument(doc);
        
        this.prefetchQueue.set(doc.file || doc.id, {
          document: doc,
          priority,
          prediction: predictionResult,
          addedAt: Date.now(),
          attempts: 0
        });
      }
    }

    // Process queue
    this.processPreloadQueue();
  }

  /**
   * Configure prefetching strategy
   */
  configurePrefetching(strategy: Partial<PrefetchStrategy>): void {
    this.strategy = { ...this.strategy, ...strategy };
  }

  /**
   * Get cached document if available
   */
  getCachedDocument(path: string): Document | null {
    const cached = this.prefetchCache.get(path);
    if (cached) {
      this.analytics.prefetchHitRate++;
      this.analytics.userExperienceImprovement += 0.1; // Estimate UX improvement
    }
    return cached || null;
  }

  /**
   * Record navigation for learning
   */
  recordNavigation(from: Document, to: Document, dwellTime: number): void {
    const history: NavigationHistory = {
      path: [from.file || from.id, to.file || to.id],
      timestamps: [Date.now() - dwellTime, Date.now()],
      dwellTimes: [dwellTime],
      source: 'click' // Could be enhanced to detect actual source
    };

    this.navigationHistory.push(history);

    // Limit history size
    if (this.navigationHistory.length > 100) {
      this.navigationHistory = this.navigationHistory.slice(-50);
    }

    // Trigger new predictions based on navigation
    this.triggerPredictiveLoading(to);
  }

  /**
   * Get analytics data
   */
  getAnalytics(): PredictiveLoadingAnalytics {
    return { ...this.analytics };
  }

  /**
   * Clear cache and reset
   */
  clearCache(): void {
    this.prefetchCache.clear();
    this.prefetchQueue.clear();
  }

  /**
   * Predict documents based on navigation patterns
   */
  private predictFromNavigationPatterns(
    currentDoc: Document,
    history: NavigationHistory
  ): PredictionResult[] {
    const predictions: PredictionResult[] = [];

    // Sequential pattern prediction
    if (this.isSequentialNavigation(history)) {
      const nextSequential = this.predictNextSequential(currentDoc);
      if (nextSequential) {
        predictions.push(nextSequential);
      }
    }

    // Category-based prediction
    if (currentDoc.category) {
      const categoryPredictions = this.predictWithinCategory(currentDoc);
      predictions.push(...categoryPredictions);
    }

    // Related document prediction
    const relatedPredictions = this.predictRelatedDocuments(currentDoc, history);
    predictions.push(...relatedPredictions);

    return predictions;
  }

  /**
   * Check if should preload based on conditions
   */
  private shouldPreload(): boolean {
    // Check network conditions
    if (this.strategy.networkAware && this.networkConditions) {
      if (this.networkConditions.saveData) return false;
      if (this.networkConditions.effectiveType === '2g' || 
          this.networkConditions.effectiveType === 'slow-2g') return false;
      if (this.networkConditions.downlink < 1) return false; // < 1 Mbps
    }

    // Check if mobile and mobile optimization is enabled
    if (this.strategy.mobileOptimized && this.isMobileDevice()) {
      return this.networkConditions?.effectiveType === '4g' || false;
    }

    // Check if already preloading too many
    const activePreloads = Array.from(this.prefetchQueue.values())
      .filter(item => item.attempts > 0).length;
    
    return activePreloads < this.strategy.maxConcurrent;
  }

  /**
   * Process the preload queue
   */
  private async processPreloadQueue(): Promise<void> {
    if (this.isPreloading) return;
    this.isPreloading = true;

    try {
      // Sort queue by priority and prediction confidence
      const sortedItems = Array.from(this.prefetchQueue.entries())
        .filter(([_, item]) => item.attempts === 0)
        .sort(([_, a], [__, b]) => {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          const scoreA = priorityWeight[a.priority] * a.prediction.confidence;
          const scoreB = priorityWeight[b.priority] * b.prediction.confidence;
          return scoreB - scoreA;
        });

      // Process items up to max concurrent limit
      const itemsToProcess = sortedItems.slice(0, this.strategy.maxConcurrent);

      await Promise.all(
        itemsToProcess.map(([path, item]) => this.preloadSingleDocument(path, item))
      );
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Preload a single document
   */
  private async preloadSingleDocument(path: string, item: PrefetchItem): Promise<void> {
    item.attempts++;

    try {
      // Simulate document loading (would be actual fetch in real implementation)
      const loadedDoc = await this.loadDocument(item.document);
      
      if (loadedDoc) {
        this.prefetchCache.set(path, loadedDoc);
        this.prefetchQueue.delete(path);
        this.analytics.bandwidthSaved += this.estimateDocumentSize(loadedDoc);
      }
    } catch (error) {
      console.warn(`Failed to preload document ${path}:`, error);
      
      // Remove from queue if too many attempts
      if (item.attempts >= 3) {
        this.prefetchQueue.delete(path);
      }
    }
  }

  /**
   * Initialize network condition monitoring
   */
  private initializeNetworkMonitoring(): void {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      
      this.networkConditions = {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 100,
        saveData: connection.saveData || false
      };

      // Monitor changes
      connection.addEventListener('change', () => {
        this.networkConditions = {
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          saveData: connection.saveData || false
        };
      });
    }
  }

  /**
   * Start background prefetching process
   */
  private startBackgroundPrefetching(): void {
    // Process queue periodically
    setInterval(() => {
      if (this.prefetchQueue.size > 0 && this.shouldPreload()) {
        this.processPreloadQueue();
      }
    }, 2000); // Every 2 seconds

    // Clean up old items
    setInterval(() => {
      const now = Date.now();
      for (const [path, item] of this.prefetchQueue.entries()) {
        if (now - item.addedAt > 300000) { // 5 minutes
          this.prefetchQueue.delete(path);
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Trigger predictive loading for a document
   */
  private triggerPredictiveLoading(document: Document): void {
    // Find relevant navigation history
    const recentHistory = this.navigationHistory.slice(-5);
    const combinedHistory: NavigationHistory = {
      path: recentHistory.flatMap(h => h.path),
      timestamps: recentHistory.flatMap(h => h.timestamps),
      dwellTimes: recentHistory.flatMap(h => h.dwellTimes),
      source: 'click'
    };

    // Get predictions
    const predictions = this.predictNextDocuments(document, combinedHistory);
    
    // Preload with medium priority
    this.preloadDocuments(predictions, 'medium');
  }

  // Helper methods (would have full implementations)
  private deduplicatePredictions(predictions: PredictionResult[]): PredictionResult[] {
    const seen = new Set<string>();
    return predictions.filter(pred => {
      if (seen.has(pred.path)) return false;
      seen.add(pred.path);
      return true;
    });
  }

  private convertPredictionsToDocuments(predictions: PredictionResult[]): Document[] {
    // Would convert prediction results to actual Document objects
    return [];
  }

  private findPredictionForDocument(doc: Document): PredictionResult {
    // Find the prediction that led to this document
    return {
      path: doc.file || doc.id,
      probability: 0.8,
      reasoning: 'Navigation pattern prediction',
      source: 'ml_model',
      confidence: 0.8
    };
  }

  private isSequentialNavigation(history: NavigationHistory): boolean {
    // Detect if user is navigating sequentially through documents
    return history.path.length > 1;
  }

  private predictNextSequential(currentDoc: Document): PredictionResult | null {
    // Predict next document in sequence
    const match = currentDoc.file?.match(/(\d+)/);
    if (match && currentDoc.file) {
      const nextNum = parseInt(match[1]) + 1;
      const nextPath = currentDoc.file.replace(match[1], String(nextNum).padStart(match[1].length, '0'));
      
      return {
        path: nextPath,
        probability: 0.8,
        reasoning: 'Sequential navigation pattern detected',
        source: 'pattern_match',
        confidence: 0.8
      };
    }
    return null;
  }

  private predictWithinCategory(currentDoc: Document): PredictionResult[] {
    // Predict other documents in the same category
    if (!currentDoc.category) return [];
    
    return [{
      path: `${currentDoc.category}/index.md`,
      probability: 0.6,
      reasoning: `Category-based prediction for ${currentDoc.category}`,
      source: 'pattern_match',
      confidence: 0.6
    }];
  }

  private predictRelatedDocuments(currentDoc: Document, history: NavigationHistory): PredictionResult[] {
    // Predict related documents based on content and history
    return [];
  }

  private isMobileDevice(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  private async loadDocument(document: Document): Promise<Document | null> {
    // Would perform actual document loading
    try {
      const response = await fetch(document.file || document.id);
      if (response.ok) {
        const content = await response.text();
        return { ...document, content };
      }
    } catch (error) {
      console.warn('Failed to load document:', error);
    }
    return null;
  }

  private estimateDocumentSize(document: Document): number {
    // Estimate document size in bytes
    return (document.content?.length || 1000) * 2; // Rough estimate
  }
}

/**
 * Factory function for predictive loading
 */
export function createPredictiveLoading(
  strategy?: Partial<PrefetchStrategy>,
  mlRecognition?: MLPatternRecognition
): PredictiveDocumentLoading {
  if (!mlRecognition) {
    throw new Error('MLPatternRecognition instance required for predictive loading');
  }
  return new PredictiveDocumentLoading(strategy, mlRecognition);
}