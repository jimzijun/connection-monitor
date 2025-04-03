"use client";

import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ConnectionMonitor, ConnectionMetrics } from '@/services/connectionMonitor';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 750
  },
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: {
        display: true,
        text: 'Latency (ms)',
      },
      min: 0,
      suggestedMax: 1000,
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: true,
        text: 'Download Speed (MB/s)',
      },
      min: 0,
      suggestedMax: 5,
      grid: {
        drawOnChartArea: false,
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          if (value === null) {
            return `${label}: Connection failed`;
          }
          if (label.includes('Latency')) {
            return `${label}: ${value.toFixed(0)} ms`;
          }
          return `${label}: ${value.toFixed(2)} MB/s`;
        },
      },
    },
  },
};

export default function ConnectionGraph() {
  const [metrics, setMetrics] = useState<ConnectionMetrics[]>([]);
  const [status, setStatus] = useState<'good' | 'fair' | 'poor'>('poor');
  const [isUpdating, setIsUpdating] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const monitor = useRef(ConnectionMonitor.getInstance());
  const intervalRef = useRef<NodeJS.Timeout>();

  const updateMetrics = async () => {
    try {
      await monitor.current.updateMetrics();
      const newMetrics = monitor.current.getMetrics();
      setMetrics([...newMetrics]); // Create a new array to force re-render
      const currentStatus = newMetrics[newMetrics.length - 1]?.status || 'poor';
      setStatus(currentStatus);
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  };

  useEffect(() => {
    // Reset metrics array when interval changes
    setMetrics([]);
    
    // Initial update
    updateMetrics();

    // Clear existing interval if any
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval for updates
    intervalRef.current = setInterval(updateMetrics, updateInterval * 1000);

    // Cleanup function - only clear the interval
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateInterval]); // Add updateInterval to dependencies

  const formatData = (rawData: ConnectionMetrics[]) => {
    return {
      labels: rawData.map(m => new Date(m.timestamp).toLocaleTimeString()),
      datasets: [
        {
          label: 'Latency (ms)',
          data: rawData.map(m => m.latency === -1 ? null : m.latency),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: 'Download Speed (MB/s)',
          data: rawData.map(m => m.downloadSpeed === -1 ? null : m.downloadSpeed),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1,
          yAxisID: 'y1',
        },
      ],
    };
  };

  const chartData = formatData(metrics);

  const statusColors = {
    good: 'bg-green-500',
    fair: 'bg-yellow-500',
    poor: 'bg-red-500',
  };

  const statusMessages = {
    good: 'Connection is stable and fast',
    fair: 'Connection is usable but could be better',
    poor: 'Connection is unstable or slow',
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${statusColors[status]}`} />
          <span className="text-sm font-medium">
            Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {statusMessages[status]}
        </div>
        {isUpdating && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Update interval:</span>
            <input
              type="range"
              min="1"
              max="30"
              value={updateInterval}
              onChange={(e) => setUpdateInterval(Number(e.target.value))}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span>{updateInterval}s</span>
          </div>
        )}
      </div>
      <div className="h-[400px] bg-white rounded-lg shadow-lg p-4">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
} 