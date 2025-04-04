'use client';

import React, { useState } from 'react';
import { EndpointConfig, ConnectionMonitor } from '../services/connectionMonitor';

interface EndpointMetrics {
  [key: string]: {
    latency?: number;
    downloadSpeed?: number;
  };
}

interface EditingEndpoint {
  id: string;
  name: string;
  url: string;
}

export default function EndpointSelector() {
  const [endpoints, setEndpoints] = React.useState<EndpointConfig[]>([]);
  const [metrics, setMetrics] = useState<EndpointMetrics>({});
  const [editingEndpoint, setEditingEndpoint] = useState<EditingEndpoint | null>(null);
  const [showAddForm, setShowAddForm] = useState<{ type: 'latency' | 'speed' } | null>(null);
  const [newEndpoint, setNewEndpoint] = useState<Omit<EndpointConfig, 'id'>>({
    name: '',
    url: '',
    enabled: true,
    type: 'latency'
  });
  
  const monitor = ConnectionMonitor.getInstance();

  React.useEffect(() => {
    setEndpoints(monitor.getEndpoints());

    // Set up interval to update metrics
    const intervalId = setInterval(async () => {
      const endpointMetrics: EndpointMetrics = {};
      
      // Measure metrics for each enabled endpoint
      for (const endpoint of monitor.getEndpoints()) {
        if (endpoint.enabled) {
          if (endpoint.type === 'latency') {
            const latency = await monitor.measureEndpointLatency(endpoint);
            endpointMetrics[endpoint.id] = { latency };
          } else if (endpoint.type === 'speed') {
            const speed = await monitor.measureFileDownloadSpeed(endpoint);
            endpointMetrics[endpoint.id] = { downloadSpeed: speed };
          }
        }
      }
      
      setMetrics(endpointMetrics);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId);
  }, [monitor]); // Add monitor as a dependency

  const handleToggle = (id: string) => {
    const endpoint = endpoints.find(ep => ep.id === id);
    if (endpoint) {
      monitor.updateEndpoint(id, { enabled: !endpoint.enabled });
      setEndpoints(monitor.getEndpoints());
      // Clear metrics for disabled endpoint
      if (!endpoint.enabled) {
        setMetrics(prev => {
          const newMetrics = { ...prev };
          delete newMetrics[id];
          return newMetrics;
        });
      }
    }
  };

  const handleEdit = (endpoint: EndpointConfig) => {
    setEditingEndpoint({
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url
    });
  };

  const handleSaveEdit = () => {
    if (editingEndpoint) {
      monitor.updateEndpoint(editingEndpoint.id, {
        name: editingEndpoint.name,
        url: editingEndpoint.url
      });
      setEndpoints(monitor.getEndpoints());
      setEditingEndpoint(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingEndpoint(null);
  };

  const handleAddNew = () => {
    if (!showAddForm) return;
    
    const id = `custom-${Date.now()}`;
    monitor.addEndpoint({
      id,
      ...newEndpoint,
      type: showAddForm.type
    });
    setEndpoints(monitor.getEndpoints());
    setShowAddForm(null);
    setNewEndpoint({
      name: '',
      url: '',
      enabled: true,
      type: 'latency'
    });
  };

  const handleReset = () => {
    monitor.resetEndpoints();
    setEndpoints(monitor.getEndpoints());
    setMetrics({});
  };

  const formatMetric = (value: number | undefined, type: 'latency' | 'speed') => {
    if (value === undefined || value === -1) return { value: '---', unit: type === 'latency' ? 'ms' : 'Mbps', isError: true };
    if (type === 'latency') return { value: Math.round(value).toString(), unit: 'ms', isError: value > 1000 };
    return { value: value.toFixed(2), unit: 'Mbps', isError: value < 0.01 };
  };

  const renderEndpoint = (endpoint: EndpointConfig, metric: ReturnType<typeof formatMetric>) => {
    const isEditing = editingEndpoint?.id === endpoint.id;

    const getStatusIcon = () => {
      if (!endpoint.enabled) return null;
      
      if (!metric.value || metric.value === '---') {
        return (
          <div className="flex items-center gap-1 text-red-500" title={endpoint.lastError}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs truncate max-w-[200px]">{endpoint.lastError || 'Connection failed'}</span>
          </div>
        );
      }

      switch (endpoint.status) {
        case 'error':
          return (
            <div className="flex items-center gap-1 text-red-500" title={endpoint.lastError}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs truncate max-w-[200px]">{endpoint.lastError}</span>
            </div>
          );
        case 'warning':
          return (
            <div className="flex items-center gap-1 text-yellow-500" title={endpoint.lastError}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs truncate max-w-[200px]">{endpoint.lastError}</span>
            </div>
          );
        case 'ok':
          return (
            <div className="flex items-center gap-1 text-green-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          );
        default:
          return (
            <div className="flex items-center gap-1 text-gray-500">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          );
      }
    };

    if (isEditing) {
      return (
        <div className="py-3 px-4 bg-[#1a2234]">
          <div className="flex items-center gap-3 mb-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={endpoint.enabled}
                onChange={() => handleToggle(endpoint.id)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer 
                peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
                after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full 
                after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <div className="flex-1">
              <input
                type="text"
                value={editingEndpoint.name}
                onChange={(e) => setEditingEndpoint(prev => ({ ...prev!, name: e.target.value }))}
                className="w-full bg-[#2a3447] text-white px-3 py-2 rounded-lg text-sm"
                placeholder="Endpoint Name"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEdit}
                className="p-2 text-blue-500 hover:text-blue-400 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-2 text-gray-400 hover:text-gray-300 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="pl-7">
            <input
              type="text"
              value={editingEndpoint.url}
              onChange={(e) => setEditingEndpoint(prev => ({ ...prev!, url: e.target.value }))}
              placeholder="URL"
              className="w-full bg-[#2a3447] text-white px-3 py-2 rounded-lg text-sm"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="h-16 flex items-center justify-between py-2 px-4">
        <div className="flex items-center gap-3 flex-1">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={endpoint.enabled}
              onChange={() => handleToggle(endpoint.id)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer 
              peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
              after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full 
              after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <span className="text-sm text-gray-200 flex-1">{endpoint.name}</span>
          {getStatusIcon()}
          <button
            onClick={() => handleEdit(endpoint)}
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            Edit
          </button>
        </div>
        
        {endpoint.enabled && (
          <div className="flex flex-col items-end min-w-[100px]">
            <span className={`text-2xl font-bold ${metric.isError ? 'text-red-500' : endpoint.status === 'warning' ? 'text-yellow-500' : 'text-white'}`}>
              {metric.value}
            </span>
            <span className="text-xs text-gray-400">
              {metric.unit}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderAddForm = (type: 'latency' | 'speed') => {
    if (showAddForm?.type !== type) return null;

    return (
      <div className="py-3 px-4 bg-[#1a2234]">
        <div className="flex items-center gap-3 mb-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={newEndpoint.enabled}
              onChange={(e) => setNewEndpoint(prev => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer 
              peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
              after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full 
              after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <div className="flex-1">
            <input
              type="text"
              value={newEndpoint.name}
              onChange={(e) => setNewEndpoint(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-[#2a3447] text-white px-3 py-2 rounded-lg text-sm"
              placeholder="Endpoint Name"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddNew}
              className="p-2 text-blue-500 hover:text-blue-400 focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={() => {
                setShowAddForm(null);
                setNewEndpoint({
                  name: '',
                  url: '',
                  enabled: true,
                  type: 'latency'
                });
              }}
              className="p-2 text-gray-400 hover:text-gray-300 focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="pl-7">
          <input
            type="text"
            value={newEndpoint.url}
            onChange={(e) => setNewEndpoint(prev => ({ ...prev, url: e.target.value }))}
            placeholder="URL"
            className="w-full bg-[#2a3447] text-white px-3 py-2 rounded-lg text-sm"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-semibold text-white mb-1">Connection Monitor</h3>
          <p className="text-gray-400 text-sm">Monitor your endpoints&apos; latency and download speeds</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1a2234] rounded-xl overflow-hidden border border-gray-800">
          <div className="px-6 py-4 bg-[#1f2937] border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-medium text-white">Latency Test Endpoints</h4>
            </div>
            <button
              onClick={() => {
                setNewEndpoint(prev => ({ ...prev, type: 'latency' }));
                setShowAddForm({ type: 'latency' });
              }}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Endpoint
            </button>
          </div>
          <div className="divide-y divide-gray-800">
            {endpoints
              .filter(ep => ep.type === 'latency')
              .map(endpoint => renderEndpoint(
                endpoint,
                formatMetric(metrics[endpoint.id]?.latency, 'latency')
              ))}
            {renderAddForm('latency')}
          </div>
        </div>

        <div className="bg-[#1a2234] rounded-xl overflow-hidden border border-gray-800">
          <div className="px-6 py-4 bg-[#1f2937] border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h4 className="font-medium text-white">Speed Test Endpoints</h4>
            </div>
            <button
              onClick={() => {
                setNewEndpoint(prev => ({ ...prev, type: 'speed' }));
                setShowAddForm({ type: 'speed' });
              }}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Endpoint
            </button>
          </div>
          <div className="divide-y divide-gray-800">
            {endpoints
              .filter(ep => ep.type === 'speed')
              .map(endpoint => renderEndpoint(
                endpoint,
                formatMetric(metrics[endpoint.id]?.downloadSpeed, 'speed')
              ))}
            {renderAddForm('speed')}
          </div>
        </div>
      </div>
    </div>
  );
} 