import type { CompanionBridge } from '../shared/companion';

declare global {
  interface Window {
    companion?: CompanionBridge;
  }
}

export {};
