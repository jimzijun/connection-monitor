'use client';

import { useEffect } from 'react';
import { ConnectionMonitor } from '../services/connectionMonitor';

export function BaseUrlInitializer() {
  useEffect(() => {
    const monitor = ConnectionMonitor.getInstance();
    // We're serving from root now, so no base path needed
    monitor.setBaseUrl('');
  }, []);

  return null;
} 