// Performance monitoring and rate limiting for Supabase queries
class SupabasePerformanceMonitor {
  private static instance: SupabasePerformanceMonitor;
  private activeQueries = 0;
  private maxConcurrentQueries = 0;
  private queryTimes: number[] = [];
  private readonly MAX_CONCURRENT_QUERIES = 12; // Limit concurrent queries
  private pendingQueries: Array<() => void> = [];
  
  private constructor() {}
  
  static getInstance(): SupabasePerformanceMonitor {
    if (!SupabasePerformanceMonitor.instance) {
      SupabasePerformanceMonitor.instance = new SupabasePerformanceMonitor();
    }
    return SupabasePerformanceMonitor.instance;
  }
  
  async waitForSlot(): Promise<void> {
    if (this.activeQueries < this.MAX_CONCURRENT_QUERIES) {
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      this.pendingQueries.push(resolve);
    });
  }
  
  startQuery(): number {
    this.activeQueries++;
    this.maxConcurrentQueries = Math.max(this.maxConcurrentQueries, this.activeQueries);
    return Date.now();
  }
  
  endQuery(startTime: number): void {
    this.activeQueries--;
    const duration = Date.now() - startTime;
    this.queryTimes.push(duration);
    
    // Keep only last 50 query times for averages
    if (this.queryTimes.length > 50) {
      this.queryTimes = this.queryTimes.slice(-50);
    }
    
    const avgTime = this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
    // Release a pending query if any
    if (this.pendingQueries.length > 0) {
      const nextQuery = this.pendingQueries.shift();
      if (nextQuery) {
        setTimeout(nextQuery, 0); // Release on next tick
      }
    }
  }
  
  getStats() {
    return {
      activeQueries: this.activeQueries,
      maxConcurrentQueries: this.maxConcurrentQueries,
      pendingQueries: this.pendingQueries.length,
      averageQueryTime: this.queryTimes.length > 0 
        ? this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length 
        : 0
    };
  }
}

export const performanceMonitor = SupabasePerformanceMonitor.getInstance();