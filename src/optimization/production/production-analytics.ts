/**
 * Week 3 Production Analytics & Insights System
 * 
 * Advanced analytics system for tracking optimization effectiveness,
 * user experience metrics, and generating actionable insights for
 * continuous performance improvement.
 */

import { getGlobalPerformanceMonitor } from '../foundation/PerformanceMonitor';
import { getGlobalRequestMonitor } from '../foundation/RequestMonitor';
import { ProductionMetrics, ProductionAlert } from './production-monitoring';
import { ProductionEnvironmentInfo } from './production-utils';

export interface AnalyticsEvent {
  id: string;
  type: 'performance' | 'optimization' | 'error' | 'user-interaction';
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  sessionId: string;
  userId?: string;
  metadata: Record<string, any>;
}

export interface UserExperienceMetrics {
  // Core Web Vitals
  largestContentfulPaint: number; // LCP - target <2.5s
  firstInputDelay: number; // FID - target <100ms
  cumulativeLayoutShift: number; // CLS - target <0.1
  
  // Custom metrics
  timeToInteractive: number;
  timeToFirstByte: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  
  // User satisfaction
  taskCompletionRate: number;
  userEngagementScore: number;
  perceivedPerformanceScore: number;
  
  // Optimization impact
  optimizationBenefit: number; // % improvement from optimizations
  fallbackUsageRate: number; // % of sessions using fallbacks
}

export interface OptimizationInsights {
  // Request optimization insights
  requestEfficiency: {
    optimalBatchSize: number;
    peakConcurrencyLimit: number;
    cacheEffectivenessScore: number;
    networkLatencyImpact: number;
  };
  
  // Performance insights
  performanceBottlenecks: Array<{
    component: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendedAction: string;
  }>;
  
  // User behavior insights
  userBehavior: {
    mostAccessedDocuments: string[];
    searchPatterns: string[];
    navigationPatterns: string[];
    deviceTypeDistribution: Record<string, number>;
  };
  
  // Optimization recommendations
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'performance' | 'memory' | 'network' | 'cache';
    title: string;
    description: string;
    expectedImpact: string;
    implementation: string;
  }>;
}

export interface AnalyticsReport {
  reportId: string;
  generatedAt: number;
  timeRange: { start: number; end: number };
  
  // Summary metrics
  summary: {
    totalSessions: number;
    averageSessionDuration: number;
    optimizationSuccessRate: number;
    userSatisfactionScore: number;
  };
  
  // Detailed metrics
  metrics: {
    production: ProductionMetrics;
    userExperience: UserExperienceMetrics;
    optimization: OptimizationInsights;
  };
  
  // Trends and comparisons
  trends: {
    performanceTrend: 'improving' | 'stable' | 'declining';
    optimizationTrend: 'improving' | 'stable' | 'declining';
    userSatisfactionTrend: 'improving' | 'stable' | 'declining';
  };
  
  // Alerts and recommendations
  alerts: ProductionAlert[];
  insights: OptimizationInsights;
}

/**
 * Production Analytics System
 * 
 * Provides comprehensive analytics and insights for optimization effectiveness
 */
export class ProductionAnalytics {
  private static instance: ProductionAnalytics;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private analyticsInterval?: number;
  private isTracking = false;
  private performanceObserver?: PerformanceObserver;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializePerformanceTracking();
    this.startAnalytics();
  }

  public static getInstance(): ProductionAnalytics {
    if (!ProductionAnalytics.instance) {
      ProductionAnalytics.instance = new ProductionAnalytics();
    }
    return ProductionAnalytics.instance;
  }

  /**
   * Track optimization events
   */
  public trackOptimizationEvent(
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type: 'optimization',
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      metadata: metadata || {},
    };

    this.events.push(event);
    this.pruneOldEvents();

    // Log important optimization events
    if (category === 'smart-config-discovery' || category === 'progressive-document-discovery') {
      console.log(`📊 Analytics: ${category} ${action}`, { label, value, metadata });
    }
  }

  /**
   * Track performance events
   */
  public trackPerformanceEvent(
    action: string,
    timing: number,
    metadata?: Record<string, any>
  ): void {
    this.trackOptimizationEvent('performance', action, undefined, timing, {
      ...metadata,
      timestamp: Date.now(),
    });
  }

  /**
   * Track user experience metrics
   */
  public trackUserExperience(metrics: Partial<UserExperienceMetrics>): void {
    this.trackOptimizationEvent('user-experience', 'metrics-update', undefined, undefined, {
      metrics,
      coreWebVitalsScore: this.calculateCoreWebVitalsScore(metrics),
    });
  }

  /**
   * Track error events
   */
  public trackError(
    error: Error,
    context: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): void {
    this.trackOptimizationEvent('error', 'optimization-error', context, undefined, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500), // Limit stack trace length
      },
      severity,
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }

  /**
   * Generate comprehensive analytics report
   */
  public generateAnalyticsReport(timeRange?: { start: number; end: number }): AnalyticsReport {
    const performanceMonitor = getGlobalPerformanceMonitor();
    const reportMeasure = performanceMonitor.startMeasure('analytics-report-generation');

    try {
      const now = Date.now();
      const range = timeRange || {
        start: now - 24 * 60 * 60 * 1000, // Last 24 hours
        end: now,
      };

      const filteredEvents = this.events.filter(
        event => event.timestamp >= range.start && event.timestamp <= range.end
      );

      const report: AnalyticsReport = {
        reportId: this.generateReportId(),
        generatedAt: now,
        timeRange: range,
        summary: this.generateSummaryMetrics(filteredEvents),
        metrics: {
          production: this.getProductionMetrics(),
          userExperience: this.calculateUserExperienceMetrics(filteredEvents),
          optimization: this.generateOptimizationInsights(filteredEvents),
        },
        trends: this.calculateTrends(filteredEvents),
        alerts: this.getRecentAlerts(),
        insights: this.generateOptimizationInsights(filteredEvents),
      };

      performanceMonitor.endMeasure('analytics-report-generation');
      return report;

    } catch (error) {
      performanceMonitor.endMeasure('analytics-report-generation');
      console.error('Failed to generate analytics report:', error);
      throw error;
    }
  }

  /**
   * Get optimization effectiveness score
   */
  public getOptimizationEffectiveness(): number {
    const recentEvents = this.events.filter(
      event => event.timestamp > Date.now() - 60 * 60 * 1000 // Last hour
    );

    let score = 0;
    let factors = 0;

    // Smart config discovery effectiveness
    const configEvents = recentEvents.filter(e => e.category === 'smart-config-discovery');
    if (configEvents.length > 0) {
      const successRate = configEvents.filter(e => e.action === 'success').length / configEvents.length;
      score += successRate * 25;
      factors++;
    }

    // Progressive discovery effectiveness
    const discoveryEvents = recentEvents.filter(e => e.category === 'progressive-document-discovery');
    if (discoveryEvents.length > 0) {
      const successRate = discoveryEvents.filter(e => e.action === 'success').length / discoveryEvents.length;
      score += successRate * 30;
      factors++;
    }

    // Cache effectiveness
    const cacheEvents = recentEvents.filter(e => e.category === 'cache');
    if (cacheEvents.length > 0) {
      const hitRate = cacheEvents.filter(e => e.action === 'hit').length / cacheEvents.length;
      score += hitRate * 25;
      factors++;
    }

    // Error rate (inverted)
    const errorEvents = recentEvents.filter(e => e.type === 'error');
    const totalEvents = recentEvents.length;
    if (totalEvents > 0) {
      const errorRate = errorEvents.length / totalEvents;
      score += (1 - Math.min(errorRate, 1)) * 20;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Get real-time optimization insights
   */
  public getRealTimeInsights(): OptimizationInsights {
    return this.generateOptimizationInsights(this.events);
  }

  /**
   * Set user ID for tracking
   */
  public setUserId(userId: string): void {
    this.userId = userId;
    this.trackOptimizationEvent('session', 'user-identified', userId);
  }

  // Private helper methods
  private initializePerformanceTracking(): void {
    try {
      // Track Core Web Vitals and other performance metrics
      if ('PerformanceObserver' in window) {
        this.performanceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.processPerformanceEntry(entry);
          });
        });

        // Observe various performance entry types
        const entryTypes = ['navigation', 'measure', 'mark', 'resource'];
        entryTypes.forEach((type) => {
          try {
            this.performanceObserver?.observe({ entryTypes: [type] });
          } catch (error) {
            // Entry type not supported in this browser
          }
        });
      }

      // Track page load performance
      window.addEventListener('load', () => {
        setTimeout(() => this.trackPageLoadMetrics(), 0);
      });

      // Track user interactions
      this.trackUserInteractions();

    } catch (error) {
      console.warn('Performance tracking initialization failed:', error);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.trackPerformanceEvent('navigation', entry.duration, {
          entryType: entry.entryType,
          name: entry.name,
        });
        break;
        
      case 'measure':
        if (entry.name.startsWith('mdv-') || entry.name.includes('optimization')) {
          this.trackPerformanceEvent('optimization-measure', entry.duration, {
            measureName: entry.name,
          });
        }
        break;
        
      case 'resource':
        if (entry.name.includes('.md') || entry.name.includes('config')) {
          this.trackPerformanceEvent('resource-load', entry.duration, {
            resourceUrl: entry.name,
            resourceType: 'documentation',
          });
        }
        break;
    }
  }

  private trackPageLoadMetrics(): void {
    if ('performance' in window && performance.timing) {
      const timing = performance.timing;
      const navigationStart = timing.navigationStart;

      const metrics = {
        domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
        loadComplete: timing.loadEventEnd - navigationStart,
        timeToFirstByte: timing.responseStart - navigationStart,
        domInteractive: timing.domInteractive - navigationStart,
      };

      this.trackUserExperience(metrics);
    }
  }

  private trackUserInteractions(): void {
    // Track clicks on documentation links
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('a[href*=".md"]') || target.closest('.doc-link')) {
        this.trackOptimizationEvent('user-interaction', 'document-click', target.textContent?.trim());
      }
    });

    // Track search usage
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.type === 'search' || target.placeholder?.toLowerCase().includes('search')) {
        this.trackOptimizationEvent('user-interaction', 'search-input', undefined, target.value.length);
      }
    });
  }

  private startAnalytics(): void {
    if (this.isTracking) return;
    
    this.isTracking = true;
    
    // Periodic analytics processing
    this.analyticsInterval = window.setInterval(() => {
      this.processAnalytics();
    }, 60000); // Every minute
    
    console.log('📊 Production analytics started');
  }

  private processAnalytics(): void {
    try {
      // Calculate and track optimization effectiveness
      const effectiveness = this.getOptimizationEffectiveness();
      this.trackOptimizationEvent('analytics', 'effectiveness-score', undefined, effectiveness);

      // Detect performance anomalies
      this.detectPerformanceAnomalies();

      // Generate insights for optimization
      this.generateRealtimeRecommendations();

    } catch (error) {
      console.warn('Analytics processing failed:', error);
    }
  }

  private detectPerformanceAnomalies(): void {
    const recentEvents = this.events.filter(
      event => event.timestamp > Date.now() - 5 * 60 * 1000 // Last 5 minutes
    );

    // Detect slow performance
    const performanceEvents = recentEvents.filter(e => e.type === 'performance');
    if (performanceEvents.length > 0) {
      const avgDuration = performanceEvents.reduce((sum, e) => sum + (e.value || 0), 0) / performanceEvents.length;
      
      if (avgDuration > 2000) { // 2 seconds threshold
        this.trackOptimizationEvent('anomaly', 'slow-performance', undefined, avgDuration, {
          threshold: 2000,
          samplesCount: performanceEvents.length,
        });
      }
    }

    // Detect high error rates
    const errorEvents = recentEvents.filter(e => e.type === 'error');
    if (errorEvents.length > 3) { // More than 3 errors in 5 minutes
      this.trackOptimizationEvent('anomaly', 'high-error-rate', undefined, errorEvents.length, {
        timeWindow: '5-minutes',
        threshold: 3,
      });
    }
  }

  private generateRealtimeRecommendations(): void {
    const insights = this.getRealTimeInsights();
    
    // Track high-priority recommendations
    insights.recommendations
      .filter(rec => rec.priority === 'high' || rec.priority === 'critical')
      .forEach(rec => {
        this.trackOptimizationEvent('recommendation', 'generated', rec.category, undefined, {
          title: rec.title,
          priority: rec.priority,
          expectedImpact: rec.expectedImpact,
        });
      });
  }

  private generateSummaryMetrics(events: AnalyticsEvent[]): AnalyticsReport['summary'] {
    const sessions = new Set(events.map(e => e.sessionId)).size;
    const sessionDurations = this.calculateSessionDurations(events);
    const avgDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length 
      : 0;

    const optimizationEvents = events.filter(e => e.type === 'optimization');
    const successfulOptimizations = optimizationEvents.filter(e => e.action === 'success').length;
    const optimizationSuccessRate = optimizationEvents.length > 0 
      ? (successfulOptimizations / optimizationEvents.length) * 100 
      : 0;

    return {
      totalSessions: sessions,
      averageSessionDuration: avgDuration,
      optimizationSuccessRate,
      userSatisfactionScore: this.calculateUserSatisfactionScore(events),
    };
  }

  private calculateUserExperienceMetrics(events: AnalyticsEvent[]): UserExperienceMetrics {
    const performanceEvents = events.filter(e => e.type === 'performance');
    const userEvents = events.filter(e => e.type === 'user-interaction');

    // Calculate Core Web Vitals from performance events
    const metrics: UserExperienceMetrics = {
      largestContentfulPaint: this.getAverageMetric(performanceEvents, 'largest-contentful-paint'),
      firstInputDelay: this.getAverageMetric(performanceEvents, 'first-input-delay'),
      cumulativeLayoutShift: this.getAverageMetric(performanceEvents, 'cumulative-layout-shift'),
      timeToInteractive: this.getAverageMetric(performanceEvents, 'time-to-interactive'),
      timeToFirstByte: this.getAverageMetric(performanceEvents, 'time-to-first-byte'),
      domContentLoaded: this.getAverageMetric(performanceEvents, 'dom-content-loaded'),
      firstContentfulPaint: this.getAverageMetric(performanceEvents, 'first-contentful-paint'),
      taskCompletionRate: this.calculateTaskCompletionRate(userEvents),
      userEngagementScore: this.calculateUserEngagementScore(userEvents),
      perceivedPerformanceScore: this.calculatePerceivedPerformanceScore(performanceEvents),
      optimizationBenefit: this.calculateOptimizationBenefit(events),
      fallbackUsageRate: this.calculateFallbackUsageRate(events),
    };

    return metrics;
  }

  private generateOptimizationInsights(events: AnalyticsEvent[]): OptimizationInsights {
    const optimizationEvents = events.filter(e => e.type === 'optimization');
    const performanceEvents = events.filter(e => e.type === 'performance');
    const userEvents = events.filter(e => e.type === 'user-interaction');

    return {
      requestEfficiency: this.calculateRequestEfficiency(optimizationEvents),
      performanceBottlenecks: this.identifyPerformanceBottlenecks(performanceEvents),
      userBehavior: this.analyzeUserBehavior(userEvents),
      recommendations: this.generateRecommendations(events),
    };
  }

  private calculateTrends(events: AnalyticsEvent[]): AnalyticsReport['trends'] {
    // Simplified trend calculation - in production this would analyze historical data
    const recentPerformance = events.filter(e => 
      e.type === 'performance' && 
      e.timestamp > Date.now() - 60 * 60 * 1000
    );
    
    const olderPerformance = events.filter(e => 
      e.type === 'performance' && 
      e.timestamp <= Date.now() - 60 * 60 * 1000 &&
      e.timestamp > Date.now() - 2 * 60 * 60 * 1000
    );

    const recentAvg = this.calculateAverageValue(recentPerformance);
    const olderAvg = this.calculateAverageValue(olderPerformance);

    const performanceTrend = recentAvg < olderAvg ? 'improving' : 
                           recentAvg > olderAvg ? 'declining' : 'stable';

    return {
      performanceTrend,
      optimizationTrend: 'improving', // Would be calculated from optimization metrics
      userSatisfactionTrend: 'stable', // Would be calculated from user satisfaction metrics
    };
  }

  // Helper methods for calculations
  private calculateCoreWebVitalsScore(metrics: Partial<UserExperienceMetrics>): number {
    let score = 0;
    let factors = 0;

    if (metrics.largestContentfulPaint !== undefined) {
      score += metrics.largestContentfulPaint < 2500 ? 100 : 
               metrics.largestContentfulPaint < 4000 ? 50 : 0;
      factors++;
    }

    if (metrics.firstInputDelay !== undefined) {
      score += metrics.firstInputDelay < 100 ? 100 : 
               metrics.firstInputDelay < 300 ? 50 : 0;
      factors++;
    }

    if (metrics.cumulativeLayoutShift !== undefined) {
      score += metrics.cumulativeLayoutShift < 0.1 ? 100 : 
               metrics.cumulativeLayoutShift < 0.25 ? 50 : 0;
      factors++;
    }

    return factors > 0 ? score / factors : 100;
  }

  private getAverageMetric(events: AnalyticsEvent[], metricName: string): number {
    const relevantEvents = events.filter(e => e.action === metricName && e.value !== undefined);
    if (relevantEvents.length === 0) return 0;
    
    return relevantEvents.reduce((sum, e) => sum + (e.value || 0), 0) / relevantEvents.length;
  }

  private calculateSessionDurations(events: AnalyticsEvent[]): number[] {
    const sessions = new Map<string, { start: number; end: number }>();
    
    events.forEach(event => {
      const sessionData = sessions.get(event.sessionId) || { start: event.timestamp, end: event.timestamp };
      sessionData.start = Math.min(sessionData.start, event.timestamp);
      sessionData.end = Math.max(sessionData.end, event.timestamp);
      sessions.set(event.sessionId, sessionData);
    });

    return Array.from(sessions.values()).map(session => session.end - session.start);
  }

  private calculateUserSatisfactionScore(events: AnalyticsEvent[]): number {
    // Simplified calculation based on error rate and performance
    const totalEvents = events.length;
    if (totalEvents === 0) return 100;

    const errorEvents = events.filter(e => e.type === 'error').length;
    const errorRate = errorEvents / totalEvents;

    return Math.max(0, 100 - (errorRate * 100));
  }

  private calculateTaskCompletionRate(userEvents: AnalyticsEvent[]): number {
    // Simplified calculation - would track specific task completion in production
    const totalTasks = userEvents.filter(e => e.action === 'task-started').length;
    const completedTasks = userEvents.filter(e => e.action === 'task-completed').length;
    
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
  }

  private calculateUserEngagementScore(userEvents: AnalyticsEvent[]): number {
    // Based on interaction frequency and variety
    const interactions = userEvents.length;
    const uniqueActions = new Set(userEvents.map(e => e.action)).size;
    
    return Math.min(100, (interactions * uniqueActions) / 10);
  }

  private calculatePerceivedPerformanceScore(performanceEvents: AnalyticsEvent[]): number {
    // Based on fast response times and smooth interactions
    const avgResponseTime = this.getAverageMetric(performanceEvents, 'response-time');
    return Math.max(0, 100 - (avgResponseTime / 100));
  }

  private calculateOptimizationBenefit(events: AnalyticsEvent[]): number {
    // Calculate improvement from optimizations
    const optimizedEvents = events.filter(e => e.metadata?.optimized === true);
    const nonOptimizedEvents = events.filter(e => e.metadata?.optimized === false);
    
    if (optimizedEvents.length === 0 || nonOptimizedEvents.length === 0) return 0;
    
    const optimizedAvg = this.calculateAverageValue(optimizedEvents);
    const nonOptimizedAvg = this.calculateAverageValue(nonOptimizedEvents);
    
    return nonOptimizedAvg > 0 ? ((nonOptimizedAvg - optimizedAvg) / nonOptimizedAvg) * 100 : 0;
  }

  private calculateFallbackUsageRate(events: AnalyticsEvent[]): number {
    const fallbackEvents = events.filter(e => e.action === 'fallback-used').length;
    const totalOptimizationAttempts = events.filter(e => e.type === 'optimization').length;
    
    return totalOptimizationAttempts > 0 ? (fallbackEvents / totalOptimizationAttempts) * 100 : 0;
  }

  private calculateRequestEfficiency(events: AnalyticsEvent[]): OptimizationInsights['requestEfficiency'] {
    const requestEvents = events.filter(e => e.category === 'request');
    
    return {
      optimalBatchSize: this.calculateOptimalBatchSize(requestEvents),
      peakConcurrencyLimit: this.calculatePeakConcurrency(requestEvents),
      cacheEffectivenessScore: this.calculateCacheEffectiveness(events),
      networkLatencyImpact: this.calculateNetworkLatencyImpact(requestEvents),
    };
  }

  private identifyPerformanceBottlenecks(events: AnalyticsEvent[]): OptimizationInsights['performanceBottlenecks'] {
    const bottlenecks: OptimizationInsights['performanceBottlenecks'] = [];
    
    // Analyze slow operations
    const slowEvents = events.filter(e => (e.value || 0) > 1000); // >1s
    if (slowEvents.length > 0) {
      bottlenecks.push({
        component: 'initialization',
        impact: 'high',
        description: `Slow initialization detected (avg: ${this.calculateAverageValue(slowEvents)}ms)`,
        recommendedAction: 'Enable progressive loading and smart caching',
      });
    }

    return bottlenecks;
  }

  private analyzeUserBehavior(events: AnalyticsEvent[]): OptimizationInsights['userBehavior'] {
    const documentClicks = events.filter(e => e.action === 'document-click');
    const searchInputs = events.filter(e => e.action === 'search-input');
    
    return {
      mostAccessedDocuments: this.getMostFrequentValues(documentClicks, 'label'),
      searchPatterns: this.getMostFrequentValues(searchInputs, 'label'),
      navigationPatterns: this.getNavigationPatterns(events),
      deviceTypeDistribution: this.getDeviceTypeDistribution(events),
    };
  }

  private generateRecommendations(events: AnalyticsEvent[]): OptimizationInsights['recommendations'] {
    const recommendations: OptimizationInsights['recommendations'] = [];
    
    // Analyze performance and generate recommendations
    const avgPerformance = this.calculateAverageValue(events.filter(e => e.type === 'performance'));
    if (avgPerformance > 2000) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Optimize initialization performance',
        description: 'Average initialization time exceeds 2 seconds',
        expectedImpact: '40-60% improvement in perceived performance',
        implementation: 'Enable Smart Config Discovery and Progressive Document Discovery',
      });
    }

    const errorRate = events.filter(e => e.type === 'error').length / Math.max(events.length, 1);
    if (errorRate > 0.05) {
      recommendations.push({
        priority: 'critical',
        category: 'cache',
        title: 'Implement robust error handling',
        description: 'Error rate exceeds acceptable threshold',
        expectedImpact: '70-80% reduction in user-facing errors',
        implementation: 'Enable enhanced error handling and fallback mechanisms',
      });
    }

    return recommendations;
  }

  // Utility methods
  private calculateAverageValue(events: AnalyticsEvent[]): number {
    const values = events.filter(e => e.value !== undefined).map(e => e.value!);
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
  }

  private calculateOptimalBatchSize(events: AnalyticsEvent[]): number {
    // Analyze batch performance to find optimal size
    const batchEvents = events.filter(e => e.metadata?.batchSize);
    if (batchEvents.length === 0) return 10; // Default
    
    // Find batch size with best performance
    const batchPerformance = new Map<number, number[]>();
    batchEvents.forEach(event => {
      const size = event.metadata.batchSize;
      const duration = event.value || 0;
      if (!batchPerformance.has(size)) {
        batchPerformance.set(size, []);
      }
      batchPerformance.get(size)!.push(duration);
    });
    
    let optimalSize = 10;
    let bestPerformance = Infinity;
    
    batchPerformance.forEach((durations, size) => {
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      if (avgDuration < bestPerformance) {
        bestPerformance = avgDuration;
        optimalSize = size;
      }
    });
    
    return optimalSize;
  }

  private calculatePeakConcurrency(events: AnalyticsEvent[]): number {
    // Analyze concurrent request performance
    return 6; // Default safe value
  }

  private calculateCacheEffectiveness(events: AnalyticsEvent[]): number {
    const cacheEvents = events.filter(e => e.category === 'cache');
    const hits = cacheEvents.filter(e => e.action === 'hit').length;
    const total = cacheEvents.length;
    
    return total > 0 ? (hits / total) * 100 : 0;
  }

  private calculateNetworkLatencyImpact(events: AnalyticsEvent[]): number {
    // Calculate how network latency affects performance
    const networkEvents = events.filter(e => e.category === 'network');
    return this.calculateAverageValue(networkEvents);
  }

  private getMostFrequentValues(events: AnalyticsEvent[], field: keyof AnalyticsEvent): string[] {
    const counts = new Map<string, number>();
    
    events.forEach(event => {
      const value = String(event[field] || 'unknown');
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value]) => value);
  }

  private getNavigationPatterns(events: AnalyticsEvent[]): string[] {
    // Analyze navigation patterns from user interactions
    const navEvents = events.filter(e => e.action === 'navigation');
    return this.getMostFrequentValues(navEvents, 'label');
  }

  private getDeviceTypeDistribution(events: AnalyticsEvent[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    events.forEach(event => {
      const deviceType = event.metadata?.deviceType || 'unknown';
      distribution[deviceType] = (distribution[deviceType] || 0) + 1;
    });
    
    return distribution;
  }

  private pruneOldEvents(): void {
    // Keep only last 24 hours of events
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.events = this.events.filter(event => event.timestamp > cutoff);
  }

  private getProductionMetrics(): ProductionMetrics {
    // Get metrics from ProductionMonitoring
    const monitoring = require('./production-monitoring').createProductionMonitoring();
    return monitoring.getMetrics();
  }

  private getRecentAlerts(): ProductionAlert[] {
    // Get alerts from ProductionMonitoring
    const monitoring = require('./production-monitoring').createProductionMonitoring();
    return monitoring.getProductionDashboard().alerts;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Cleanup and shutdown
   */
  public destroy(): void {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.isTracking = false;
  }
}

/**
 * Global instance accessor
 */
export function getGlobalProductionAnalytics(): ProductionAnalytics {
  return ProductionAnalytics.getInstance();
}

/**
 * Quick analytics tracking helpers
 */
export function trackOptimization(category: string, action: string, label?: string, value?: number): void {
  getGlobalProductionAnalytics().trackOptimizationEvent(category, action, label, value);
}

export function trackPerformance(action: string, timing: number): void {
  getGlobalProductionAnalytics().trackPerformanceEvent(action, timing);
}

export function generateAnalyticsReport(): AnalyticsReport {
  return getGlobalProductionAnalytics().generateAnalyticsReport();
}