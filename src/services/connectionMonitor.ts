import axios from 'axios';

export interface ConnectionMetrics {
  timestamp: number;
  latency: number;
  downloadSpeed: number;
  status: 'good' | 'fair' | 'poor';
}

export interface EndpointConfig {
  id: string;
  url: string;
  name: string;
  enabled: boolean;
  type: 'latency' | 'speed';
  status?: 'ok' | 'warning' | 'error';
  lastError?: string;
}

export interface MonitorConfig {
  useProxy: boolean;
}

// Default endpoints configuration
export const DEFAULT_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'httpbin',
    url: 'https://httpbin.org/get',
    name: 'HTTPBin',
    enabled: true,
    type: 'latency'
  },
  {
    id: 'google',
    url: 'https://www.google.com/generate_204',
    name: 'Google',
    enabled: true,
    type: 'latency'
  },
  {
    id: 'cloudflare',
    url: 'https://www.cloudflare.com/cdn-cgi/trace',
    name: 'Cloudflare',
    enabled: true,
    type: 'latency'
  },
  {
    id: 'cloudflare-speedtest',
    url: 'https://speed.cloudflare.com/__down',
    name: 'Cloudflare CDN',
    enabled: true,
    type: 'speed'
  },
  {
    id: 'azure-speedtest',
    url: 'https://azureedge.net/',
    name: 'Azure CDN',
    enabled: true,
    type: 'speed'
  },
  {
    id: 'aws-speedtest',
    url: 'https://d1.awsstatic.com/site-images/aws-logo.svg',
    name: 'AWS CloudFront',
    enabled: true,
    type: 'speed'
  }
];

export class ConnectionMonitor {
  private static instance: ConnectionMonitor;
  private metrics: ConnectionMetrics[] = [];
  private maxDataPoints: number = 50;
  private lastSpeedTestTime: number = 0;
  private speedTestInterval: number = 10000; // 10 seconds between speed tests
  private retryAttempts: number = 2;
  private retryDelay: number = 1000;
  private endpoints: EndpointConfig[] = [...DEFAULT_ENDPOINTS];
  private config: MonitorConfig = {
    useProxy: true
  };

  private constructor() {}

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor();
    }
    return ConnectionMonitor.instance;
  }

  getConfig(): MonitorConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<MonitorConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getEndpoints(): EndpointConfig[] {
    return [...this.endpoints];
  }

  updateEndpoint(id: string, updates: Partial<EndpointConfig>): void {
    const index = this.endpoints.findIndex(ep => ep.id === id);
    if (index !== -1) {
      this.endpoints[index] = { ...this.endpoints[index], ...updates };
    }
  }

  addEndpoint(endpoint: EndpointConfig): void {
    this.endpoints.push(endpoint);
  }

  resetEndpoints(): void {
    this.endpoints = [...DEFAULT_ENDPOINTS];
  }

  private getEnabledEndpoints(type: 'latency' | 'speed'): EndpointConfig[] {
    return this.endpoints.filter(ep => ep.enabled && ep.type === type);
  }

  async measureEndpointLatency(endpoint: EndpointConfig): Promise<number> {
    const startTime = performance.now();
    
    // Set initial status to indicate measurement in progress
    this.updateEndpoint(endpoint.id, { 
      status: undefined,
      lastError: undefined
    });
    
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        // If proxy is disabled, only try direct request
        if (!this.config.useProxy) {
          const response = await axios.get(endpoint.url, { 
            timeout: 5000,
            headers: {
              'Accept': 'application/json,text/plain,*/*',
              'Cache-Control': 'no-cache'
            }
          });
          
          const latency = performance.now() - startTime;
          this.updateEndpoint(endpoint.id, { 
            status: latency > 1000 ? 'warning' : 'ok',
            lastError: latency > 1000 ? 'High latency detected' : undefined
          });
          
          return latency;
        }

        // If proxy is enabled, try direct request first, then fallback to proxy
        try {
          const response = await axios.get(endpoint.url, { 
            timeout: 5000,
            headers: {
              'Accept': 'application/json,text/plain,*/*',
              'Cache-Control': 'no-cache'
            }
          });
          
          const latency = performance.now() - startTime;
          this.updateEndpoint(endpoint.id, { 
            status: latency > 1000 ? 'warning' : 'ok',
            lastError: latency > 1000 ? 'High latency detected' : undefined
          });
          
          return latency;
        } catch (err) {
          const error = err as Error;
          if (error.message.includes('CORS') || error.message.includes('Network Error')) {
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(endpoint.url)}`;
            const response = await axios.get(proxyUrl, { 
              timeout: 5000,
              headers: {
                'Accept': 'application/json,text/plain,*/*',
                'Cache-Control': 'no-cache'
              }
            });
            
            const latency = performance.now() - startTime;
            this.updateEndpoint(endpoint.id, { 
              status: latency > 1000 ? 'warning' : 'ok',
              lastError: latency > 1000 ? 'High latency detected' : undefined
            });
            
            return latency;
          }
          throw error;
        }
      } catch (error) {
        if (attempt === this.retryAttempts) {
          console.error(`Request failed for ${endpoint.name}:`, error);
          this.updateEndpoint(endpoint.id, { 
            status: 'error',
            lastError: error instanceof Error ? error.message : 'Connection failed'
          });
          return -1;
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    return -1;
  }

  async measureLatency(): Promise<number> {
    try {
      const enabledEndpoints = this.getEnabledEndpoints('latency');
      if (enabledEndpoints.length === 0) return -1;

      // Try multiple endpoints in parallel and use the best result
      const results = await Promise.all(
        enabledEndpoints.map(endpoint => this.measureEndpointLatency(endpoint))
      );
      
      // Filter out failed measurements (-1)
      const validResults = results.filter(r => r !== -1);
      if (validResults.length === 0) return -1;
      
      return Math.min(...validResults);
    } catch (error) {
      console.error('Latency measurement failed:', error);
      return -1;
    }
  }

  async measureFileDownloadSpeed(endpoint: EndpointConfig): Promise<number> {
    // Set initial status to indicate measurement in progress
    this.updateEndpoint(endpoint.id, { 
      status: undefined,
      lastError: undefined
    });
    
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      const startTime = performance.now();
      try {
        const url = this.config.useProxy ? 
          `/api/proxy?url=${encodeURIComponent(endpoint.url)}` : 
          endpoint.url;

        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000; // Convert to seconds
        
        // Calculate size of the response in MB
        const dataSize = JSON.stringify(response.data).length / (1024 * 1024);
        const speed = dataSize / duration; // MB/s
        
        this.updateEndpoint(endpoint.id, { 
          status: speed < 0.01 ? 'warning' : 'ok',
          lastError: speed < 0.01 ? 'Low download speed detected' : undefined
        });
        
        return speed;
      } catch (error) {
        if (attempt === this.retryAttempts) {
          console.error(`Speed measurement failed for ${endpoint.name}:`, error);
          this.updateEndpoint(endpoint.id, { 
            status: 'error',
            lastError: error instanceof Error ? error.message : 'Connection failed'
          });
          return -1;
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    return -1;
  }

  async measureDownloadSpeed(): Promise<number> {
    const now = Date.now();
    
    // If we recently did a speed test, return the last known speed
    if (now - this.lastSpeedTestTime < this.speedTestInterval) {
      const lastMetric = this.metrics[this.metrics.length - 1];
      if (lastMetric) {
        return lastMetric.downloadSpeed;
      }
    }

    try {
      // Test with multiple files and use the average speed
      const speeds = await Promise.all(
        this.getEnabledEndpoints('speed').map(endpoint => this.measureFileDownloadSpeed(endpoint))
      );
      
      // Filter out failed measurements (-1)
      const validSpeeds = speeds.filter(speed => speed !== -1);
      
      if (validSpeeds.length === 0) {
        return -1;
      }
      
      // Calculate average speed
      const avgSpeed = validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length;
      this.lastSpeedTestTime = now;
      
      return avgSpeed;
    } catch (error) {
      console.error('Speed measurement failed:', error);
      return -1;
    }
  }

  getStatus(latency: number, speed: number): 'good' | 'fair' | 'poor' {
    if (latency === -1 || speed === -1) return 'poor';
    if (latency < 200 && speed > 1) return 'good';
    if (latency < 500 && speed > 0.5) return 'fair';
    return 'poor';
  }

  async updateMetrics(): Promise<void> {
    try {
      const [latency, speed] = await Promise.all([
        this.measureLatency(),
        this.measureDownloadSpeed()
      ]);
      
      const status = this.getStatus(latency, speed);

      this.metrics.push({
        timestamp: Date.now(),
        latency,
        downloadSpeed: speed,
        status
      });

      if (this.metrics.length > this.maxDataPoints) {
        this.metrics.shift();
      }
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }

  getMetrics(): ConnectionMetrics[] {
    return [...this.metrics]; // Return a copy to prevent external modifications
  }

  async fetchLatency(): Promise<number> {
    const start = performance.now();
    try {
      await fetch(this.endpoint.url);
      const end = performance.now();
      return Math.round(end - start);
    } catch {
      return -1;
    }
  }

  async fetchDownloadSpeed(): Promise<number> {
    try {
      await fetch(this.endpoint.url);
      return Math.round(Math.random() * 100) / 10; // Simulated download speed
    } catch {
      return -1;
    }
  }

  async fetchUploadSpeed(): Promise<number> {
    try {
      await fetch(this.endpoint.url);
      return Math.round(Math.random() * 50) / 10; // Simulated upload speed
    } catch {
      return -1;
    }
  }
} 