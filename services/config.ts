export const config = {
  useMockApi: true,
  apiBaseUrl: 'http://localhost:3000/api',
  debugMode: true,
  timezone: 'UTC',
  rateLimits: {
    autoAssign: { maxRequests: 2, windowMs: 60000 }, // 2 per minute
    assignShift: { maxRequests: 20, windowMs: 60000 }, // 20 per minute
  }
};