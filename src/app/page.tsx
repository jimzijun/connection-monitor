import ConnectionGraph from '@/components/ConnectionGraph';
import { EndpointSelector } from '@/components/EndpointSelector';
import { Settings } from '@/components/Settings';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-[var(--theme-color)]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Connection Monitor</h1>
        <div className="grid gap-6">
          <div className="bg-[var(--card-background)] p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Real-time Connection Metrics</h2>
            <Settings />
            <div className="mt-6">
              <EndpointSelector />
            </div>
            <ConnectionGraph />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--card-background)] p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">Latency</h3>
              <p className="text-gray-600">Measures response time to major websites</p>
            </div>
            <div className="bg-[var(--card-background)] p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">Download Speed</h3>
              <p className="text-gray-600">Estimates your connection speed</p>
            </div>
            <div className="bg-[var(--card-background)] p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
              <p className="text-gray-600">Overall connection quality assessment</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
