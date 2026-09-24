/**
 * System health status contract shared across API, workers, and frontend.
 */
export interface HealthStatus {
  status: 'ok' | 'error';
  service: string;
}
