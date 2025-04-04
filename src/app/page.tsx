import ConnectionGraph from '@/components/ConnectionGraph';
import EndpointSelector from '@/components/EndpointSelector';
import { Settings } from '@/components/Settings';
import { BaseUrlInitializer } from '@/components/BaseUrlInitializer';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-[var(--background)]">
      <BaseUrlInitializer />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[var(--foreground)]">Connection Monitor</h1>
          <ThemeSwitcher />
        </div>
        <div className="grid gap-6">
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4 text-[var(--foreground)]">Real-time Connection Metrics</h2>
            <div className="mt-6">
              <EndpointSelector />
            </div>
            <ConnectionGraph />
            <div className="mt-6">
              <Settings />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
