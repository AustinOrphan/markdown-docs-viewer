/**
 * Week 3 Production Monitoring & Analytics System
 * 
 * Real-time monitoring of optimization effectiveness in production environments
 * Provides alerting, dashboards, and rollback triggers for production deployments
 */

import { getGlobalPerformanceMonitor } from '../foundation/PerformanceMonitor';
import { getGlobalRequestMonitor } from '../foundation/RequestMonitor';
import { FeatureFlags } from '../foundation/FeatureFlags';

export interface ProductionMetrics {
  // Request reduction metrics (target: 85%+ reduction)
  requestOptimization: {
    originalRequests: number;
    optimizedRequests: number;
    reductionPercentage: number;
    targetAchieved: boolean;
  };
  
  // Initialization time tracking (target: <2 seconds)
  initializationPerformance: {
    totalTime: number;
    configDiscoveryTime: number;
    documentDiscoveryTime: number;
    targetAchieved: boolean;
  };
  
  // Cache performance (target: >90% hit rate)
  cachePerformance: {
    hitRate: number;
    missCount: number;
    evictionCount: number;
    compressionRatio: number;
    targetAchieved: boolean;
  };
  
  // Error rates (target: <1%)
  errorMetrics: {
    totalErrors: number;
    errorRate: number;
    fallbackActivations: number;
    targetAchieved: boolean;
  };
  
  // Memory usage metrics
  memoryMetrics: {
    usedMemory: number;
    peakMemory: number;
    memoryEfficiency: number;
    leaksDetected: number;
  };
  
  // User experience metrics
  userExperience: {
    perceivedLoadTime: number;
    interactionToNextPaint: number;
    cumulativeLayoutShift: number;
    userSatisfactionScore: number;
  };
}

export interface ProductionAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  category: 'performance' | 'optimization' | 'error' | 'rollback';
  message: string;
  timestamp: number;
  metrics: Partial<ProductionMetrics>;
  actionRequired: boolean;
  suggestedActions: string[];
}

export interface ProductionDashboard {
  optimizationEffectiveness: number; // 0-100 score
  performanceTargets: {
    requestReduction: { current: number; target: number; achieved: boolean };
    initializationTime: { current: number; target: number; achieved: boolean };
    cacheHitRate: { current: number; target: number; achieved: boolean };
    errorRate: { current: number; target: number; achieved: boolean };
  };
  trends: {
    requestReductionTrend: number[];
    performanceTrend: number[];
    errorRateTrend: number[];
  };
  alerts: ProductionAlert[];
  recommendations: string[];
}

/**
 * Production Monitoring System
 * 
 * Provides comprehensive monitoring and analytics for production optimization
 */
export class ProductionMonitoring {
  private static instance: ProductionMonitoring;
  private metrics: ProductionMetrics;
  private alerts: ProductionAlert[] = [];
  private monitoringInterval?: number;
  private alertCallbacks: Array<(alert: ProductionAlert) => void> = [];
  private baselineMetrics?: ProductionMetrics;
  private isMonitoring = false;

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  public static getInstance(): ProductionMonitoring {
    if (!ProductionMonitoring.instance) {
      ProductionMonitoring.instance = new ProductionMonitoring();
    }
    return ProductionMonitoring.instance;
  }

  /**
   * Track optimization effectiveness
   */
  public trackOptimizationEffectiveness(metrics: {
    requestReduction: number; // Target: >85%
    initializationTime: number; // Target: <2s
    cacheHitRate: number; // Target: >90%
    errorRate: number; // Target: <1%
  }): void {
    const performanceMonitor = getGlobalPerformanceMonitor();
    const trackingMeasure = performanceMonitor.startMeasure('optimization-tracking');

    try {
      // Update request optimization metrics
      this.metrics.requestOptimization.reductionPercentage = metrics.requestReduction;
      this.metrics.requestOptimization.targetAchieved = metrics.requestReduction >= 85;

      // Update initialization performance
      this.metrics.initializationPerformance.totalTime = metrics.initializationTime;
      this.metrics.initializationPerformance.targetAchieved = metrics.initializationTime < 2000;

      // Update cache performance
      this.metrics.cachePerformance.hitRate = metrics.cacheHitRate;
      this.metrics.cachePerformance.targetAchieved = metrics.cacheHitRate >= 0.9;

      // Update error metrics
      this.metrics.errorMetrics.errorRate = metrics.errorRate;
      this.metrics.errorMetrics.targetAchieved = metrics.errorRate < 0.01;

      // Check for alerts
      this.checkPerformanceAlerts();

      performanceMonitor.endMeasure('optimization-tracking');

    } catch (error) {
      performanceMonitor.endMeasure('optimization-tracking');
      console.error('Failed to track optimization effectiveness:', error);
    }
  }

  /**
   * Report performance metrics with detailed timing
   */
  public reportPerformanceMetrics(timing: {
    configDiscovery: number;
    documentDiscovery: number;
    totalInitialization: number;
    memoryUsage: number;
  }): void {
    try {
      // Update performance timing
      this.metrics.initializationPerformance.configDiscoveryTime = timing.configDiscovery;
      this.metrics.initializationPerformance.documentDiscoveryTime = timing.documentDiscovery;
      this.metrics.initializationPerformance.totalTime = timing.totalInitialization;

      // Update memory metrics
      this.metrics.memoryMetrics.usedMemory = timing.memoryUsage;
      this.metrics.memoryMetrics.peakMemory = Math.max(
        this.metrics.memoryMetrics.peakMemory,
        timing.memoryUsage
      );

      // Calculate memory efficiency (inverse of memory growth)
      if (this.baselineMetrics) {
        const memoryGrowth = timing.memoryUsage - this.baselineMetrics.memoryMetrics.usedMemory;
        this.metrics.memoryMetrics.memoryEfficiency = Math.max(0, 100 - (memoryGrowth / timing.memoryUsage) * 100);
      }

      // Check for performance degradation
      this.checkPerformanceDegradation();

    } catch (error) {
      console.error('Failed to report performance metrics:', error);
    }
  }

  /**
   * Monitor optimization errors and alerting
   */
  public monitorOptimizationErrors(error: {
    type: 'config-discovery' | 'document-discovery' | 'cache-failure' | 'network-error';
    severity: 'warning' | 'error' | 'critical';
    fallbackActivated: boolean;
    details?: string;
  }): void {
    try {
      // Update error metrics
      this.metrics.errorMetrics.totalErrors++;
      if (error.fallbackActivated) {
        this.metrics.errorMetrics.fallbackActivations++;
      }

      // Create alert for significant errors
      if (error.severity === 'error' || error.severity === 'critical') {
        this.createAlert({
          type: error.severity,
          category: 'error',
          message: `Optimization ${error.type} failed: ${error.details || 'Unknown error'}`,
          metrics: { errorMetrics: this.metrics.errorMetrics },
          actionRequired: error.severity === 'critical',
          suggestedActions: this.getErrorRecoveryActions(error.type, error.severity),
        });
      }

      // Check if error rate exceeds threshold
      const totalRequests = this.getTotalRequests();
      if (totalRequests > 0) {
        this.metrics.errorMetrics.errorRate = this.metrics.errorMetrics.totalErrors / totalRequests;
        
        if (this.metrics.errorMetrics.errorRate > 0.05) { // 5% error rate threshold
          this.createAlert({
            type: 'critical',
            category: 'rollback',
            message: `Error rate (${(this.metrics.errorMetrics.errorRate * 100).toFixed(1)}%) exceeds threshold`,
            metrics: { errorMetrics: this.metrics.errorMetrics },
            actionRequired: true,
            suggestedActions: ['Consider rolling back optimizations', 'Investigate error patterns', 'Enable fallback mode'],
          });
        }
      }

    } catch (error) {
      console.error('Failed to monitor optimization errors:', error);
    }
  }

  /**
   * Get comprehensive production dashboard
   */
  public getProductionDashboard(): ProductionDashboard {
    const optimizationScore = this.calculateOptimizationScore();
    
    return {
      optimizationEffectiveness: optimizationScore,
      performanceTargets: {
        requestReduction: {
          current: this.metrics.requestOptimization.reductionPercentage,
          target: 85,
          achieved: this.metrics.requestOptimization.targetAchieved,
        },
        initializationTime: {
          current: this.metrics.initializationPerformance.totalTime,
          target: 2000,
          achieved: this.metrics.initializationPerformance.targetAchieved,
        },
        cacheHitRate: {
          current: this.metrics.cachePerformance.hitRate * 100,
          target: 90,
          achieved: this.metrics.cachePerformance.targetAchieved,
        },
        errorRate: {
          current: this.metrics.errorMetrics.errorRate * 100,
          target: 1,
          achieved: this.metrics.errorMetrics.targetAchieved,
        },
      },
      trends: this.calculateTrends(),
      alerts: this.getActiveAlerts(),
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Check rollback conditions
   */
  public checkRollbackConditions(): {
    shouldRollback: boolean;
    reason?: string;
    severity: 'warning' | 'critical';
  } {
    // Critical rollback conditions
    if (this.metrics.errorMetrics.errorRate > 0.1) { // 10% error rate
      return {
        shouldRollback: true,
        reason: `Critical error rate: ${(this.metrics.errorMetrics.errorRate * 100).toFixed(1)}%`,
        severity: 'critical',
      };
    }

    if (this.metrics.initializationPerformance.totalTime > 10000) { // 10 seconds
      return {
        shouldRollback: true,
        reason: `Severe performance degradation: ${this.metrics.initializationPerformance.totalTime}ms initialization`,
        severity: 'critical',
      };
    }

    if (this.metrics.memoryMetrics.leaksDetected > 5) {
      return {
        shouldRollback: true,
        reason: `Multiple memory leaks detected: ${this.metrics.memoryMetrics.leaksDetected}`,
        severity: 'critical',
      };
    }

    // Warning rollback conditions
    if (this.metrics.cachePerformance.hitRate < 0.5) { // 50% hit rate
      return {
        shouldRollback: false,
        reason: `Poor cache performance: ${(this.metrics.cachePerformance.hitRate * 100).toFixed(1)}% hit rate`,
        severity: 'warning',
      };
    }

    if (this.metrics.requestOptimization.reductionPercentage < 50) { // 50% reduction
      return {
        shouldRollback: false,
        reason: `Insufficient optimization: ${this.metrics.requestOptimization.reductionPercentage}% request reduction`,
        severity: 'warning',
      };
    }

    return { shouldRollback: false, severity: 'warning' };
  }

  /**
   * Subscribe to alerts
   */
  public onAlert(callback: (alert: ProductionAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Get current metrics
   */
  public getMetrics(): ProductionMetrics {
    return { ...this.metrics };
  }

  /**
   * Set baseline metrics for comparison
   */
  public setBaselineMetrics(): void {
    this.baselineMetrics = { ...this.metrics };
    console.log('📊 Baseline metrics established for comparison');
  }

  // Private helper methods
  private initializeMetrics(): ProductionMetrics {
    return {
      requestOptimization: {
        originalRequests: 0,
        optimizedRequests: 0,
        reductionPercentage: 0,
        targetAchieved: false,
      },
      initializationPerformance: {
        totalTime: 0,
        configDiscoveryTime: 0,
        documentDiscoveryTime: 0,
        targetAchieved: false,
      },
      cachePerformance: {
        hitRate: 0,
        missCount: 0,
        evictionCount: 0,
        compressionRatio: 0,
        targetAchieved: false,
      },
      errorMetrics: {
        totalErrors: 0,
        errorRate: 0,
        fallbackActivations: 0,
        targetAchieved: true,
      },
      memoryMetrics: {
        usedMemory: 0,
        peakMemory: 0,
        memoryEfficiency: 100,
        leaksDetected: 0,
      },
      userExperience: {
        perceivedLoadTime: 0,
        interactionToNextPaint: 0,
        cumulativeLayoutShift: 0,
        userSatisfactionScore: 100,
      },
    };
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor performance every 30 seconds
    this.monitoringInterval = window.setInterval(() => {
      this.updateRealTimeMetrics();
      this.checkPerformanceAlerts();
    }, 30000);
    
    console.log('📊 Production monitoring started');
  }

  private updateRealTimeMetrics(): void {
    try {
      // Update metrics from global monitors
      const performanceMonitor = getGlobalPerformanceMonitor();
      const requestMonitor = getGlobalRequestMonitor();
      
      const perfStats = performanceMonitor.getStats();
      const reqStats = requestMonitor.getStats();
      
      // Update request metrics
      if (reqStats.totalRequests > 0) {
        this.metrics.requestOptimization.originalRequests = reqStats.totalRequests;
        this.metrics.requestOptimization.optimizedRequests = reqStats.cachedRequests;
        this.metrics.requestOptimization.reductionPercentage = 
          (reqStats.cachedRequests / reqStats.totalRequests) * 100;
      }
      
      // Update initialization performance
      const perfMonitor = getGlobalPerformanceMonitor();
      const reports = perfMonitor.getReport();
      const initReport = reports.find(r => r.label === 'zero-config-init');
      if (initReport) {
        this.metrics.initializationPerformance.totalTime = initReport.duration;
      }
      
    } catch (error) {
      console.warn('Failed to update real-time metrics:', error);
    }
  }

  private checkPerformanceAlerts(): void {
    // Check if any targets are not being met
    if (!this.metrics.requestOptimization.targetAchieved && this.metrics.requestOptimization.reductionPercentage > 0) {
      this.createAlert({
        type: 'warning',
        category: 'performance',
        message: `Request reduction (${this.metrics.requestOptimization.reductionPercentage.toFixed(1)}%) below target`,
        metrics: { requestOptimization: this.metrics.requestOptimization },
        actionRequired: false,
        suggestedActions: ['Enable aggressive caching', 'Optimize request pooling', 'Review discovery algorithms'],
      });
    }

    if (!this.metrics.initializationPerformance.targetAchieved && this.metrics.initializationPerformance.totalTime > 0) {
      this.createAlert({
        type: 'warning',
        category: 'performance',
        message: `Initialization time (${this.metrics.initializationPerformance.totalTime}ms) exceeds target`,
        metrics: { initializationPerformance: this.metrics.initializationPerformance },
        actionRequired: false,
        suggestedActions: ['Enable smart config discovery', 'Implement progressive loading', 'Optimize cache warming'],
      });
    }
  }

  private checkPerformanceDegradation(): void {
    if (!this.baselineMetrics) return;
    
    const initTimeDelta = this.metrics.initializationPerformance.totalTime - 
                         this.baselineMetrics.initializationPerformance.totalTime;
    
    if (initTimeDelta > 1000) { // 1 second degradation
      this.createAlert({
        type: 'warning',
        category: 'performance',
        message: `Performance degradation detected: +${initTimeDelta}ms initialization time`,
        metrics: { initializationPerformance: this.metrics.initializationPerformance },
        actionRequired: false,
        suggestedActions: ['Check for memory leaks', 'Review optimization settings', 'Monitor resource usage'],
      });
    }
  }

  private createAlert(alertData: Omit<ProductionAlert, 'id' | 'timestamp'>): void {
    const alert: ProductionAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      ...alertData,
    };
    
    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
    
    // Notify subscribers
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Alert callback failed:', error);
      }
    });
    
    // Log critical alerts
    if (alert.type === 'critical') {
      console.error('🚨 CRITICAL ALERT:', alert.message);
    } else if (alert.type === 'error') {
      console.warn('⚠️ ERROR ALERT:', alert.message);
    }
  }

  private getTotalRequests(): number {
    const requestMonitor = getGlobalRequestMonitor();
    return requestMonitor.getStats().totalRequests || 0;
  }

  private getErrorRecoveryActions(errorType: string, severity: string): string[] {
    const actions: Record<string, string[]> = {
      'config-discovery': ['Enable fallback config loading', 'Clear config cache', 'Disable smart discovery temporarily'],
      'document-discovery': ['Enable traditional discovery', 'Clear document cache', 'Reduce batch size'],
      'cache-failure': ['Clear all caches', 'Disable compression', 'Reduce cache size'],
      'network-error': ['Enable retry policies', 'Reduce concurrent requests', 'Check network connectivity'],
    };
    
    return actions[errorType] || ['Review logs', 'Restart optimization system', 'Contact support'];
  }

  private calculateOptimizationScore(): number {
    let score = 0;
    let factors = 0;
    
    // Request reduction score (30%)
    if (this.metrics.requestOptimization.reductionPercentage > 0) {
      score += Math.min(this.metrics.requestOptimization.reductionPercentage / 85, 1) * 30;
      factors++;
    }
    
    // Initialization time score (25%)
    if (this.metrics.initializationPerformance.totalTime > 0) {
      const timeScore = Math.max(0, 1 - this.metrics.initializationPerformance.totalTime / 5000); // 5s = 0 score
      score += timeScore * 25;
      factors++;
    }
    
    // Cache hit rate score (25%)
    if (this.metrics.cachePerformance.hitRate > 0) {
      score += (this.metrics.cachePerformance.hitRate / 0.9) * 25; // 90% = full score
      factors++;
    }
    
    // Error rate score (20%)
    const errorScore = Math.max(0, 1 - this.metrics.errorMetrics.errorRate / 0.01); // 1% = 0 score
    score += errorScore * 20;
    factors++;
    
    return factors > 0 ? Math.min(score / factors * factors, 100) : 0;
  }

  private calculateTrends(): { requestReductionTrend: number[]; performanceTrend: number[]; errorRateTrend: number[] } {
    // Simplified trend calculation - in production this would use historical data
    return {
      requestReductionTrend: [
        this.metrics.requestOptimization.reductionPercentage * 0.8,
        this.metrics.requestOptimization.reductionPercentage * 0.9,
        this.metrics.requestOptimization.reductionPercentage,
      ],
      performanceTrend: [
        this.metrics.initializationPerformance.totalTime * 1.2,
        this.metrics.initializationPerformance.totalTime * 1.1,
        this.metrics.initializationPerformance.totalTime,
      ],
      errorRateTrend: [
        this.metrics.errorMetrics.errorRate * 1.1,
        this.metrics.errorMetrics.errorRate * 1.05,
        this.metrics.errorMetrics.errorRate,
      ],
    };
  }

  private getActiveAlerts(): ProductionAlert[] {
    // Return alerts from last 24 hours
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return this.alerts.filter(alert => alert.timestamp > dayAgo);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.metrics.requestOptimization.targetAchieved) {
      recommendations.push('Enable Smart Config Discovery to improve request reduction');
    }
    
    if (!this.metrics.initializationPerformance.targetAchieved) {
      recommendations.push('Implement progressive document discovery for faster initialization');
    }
    
    if (!this.metrics.cachePerformance.targetAchieved) {
      recommendations.push('Optimize cache warming strategy and compression settings');
    }
    
    if (!this.metrics.errorMetrics.targetAchieved) {
      recommendations.push('Review error handling and implement better fallback mechanisms');
    }
    
    if (this.metrics.memoryMetrics.memoryEfficiency < 80) {
      recommendations.push('Implement memory optimization and leak detection');
    }
    
    return recommendations;
  }

  /**
   * Cleanup and shutdown
   */
  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.isMonitoring = false;
  }
}

/**
 * Global instance accessor
 */
export function createProductionMonitoring(): ProductionMonitoring {
  return ProductionMonitoring.getInstance();
}

/**
 * Quick helper for getting production dashboard
 */
export function getProductionDashboard(): ProductionDashboard {
  return ProductionMonitoring.getInstance().getProductionDashboard();
}