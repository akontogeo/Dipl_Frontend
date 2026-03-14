/**
 * Service Index
 * Central export point for all API services
 */

// Export all services
export * from './datasetService';
export * from './trainingService';
export * from './gazeService';
export * from './inferenceService';
export * from './analysisService';

// Export base API instance
export { default as api } from './api';
