'use client';

import React from 'react';
import { ConnectionMonitor } from '../services/connectionMonitor';

export function Settings() {
  const monitor = ConnectionMonitor.getInstance();
  const [useProxy, setUseProxy] = React.useState(monitor.getConfig().useProxy);

  const handleProxyToggle = () => {
    const newValue = !useProxy;
    setUseProxy(newValue);
    monitor.updateConfig({ useProxy: newValue });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-[#1a2234] rounded-lg border border-gray-800">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div>
          <h3 className="text-white font-medium">Connection Settings</h3>
          <p className="text-gray-400 text-sm">Proxy will route tests through the web server</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Use Proxy</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useProxy}
              onChange={handleProxyToggle}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer 
              peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
              after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full 
              after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
} 