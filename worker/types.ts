export interface D1RunResult {
  success: boolean;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1RunResult>;
}

export interface D1DatabaseBinding {
  prepare(query: string): D1PreparedStatement;
}

export interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

export interface WorkerEnv {
  ASSETS: AssetsBinding;
  ANALYTICS_DB?: D1DatabaseBinding;
  ANALYTICS_ID_RATE_LIMITER?: RateLimiterBinding;
  ANALYTICS_IP_RATE_LIMITER?: RateLimiterBinding;
  ANALYTICS_ENABLED?: string;
  ANALYTICS_ALLOW_LOCAL?: string;
}

