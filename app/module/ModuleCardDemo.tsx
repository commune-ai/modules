import React from 'react';
import { ModuleCard } from './ModuleCard';
import { ModuleCardCompact } from './ModuleCardCompact';

const ModuleCardDemo: React.FC = () => {
  const sampleModules = [
    {
      name: 'API Gateway',
      description: 'Central API management and routing service with load balancing capabilities',
      status: 'active' as const,
      metrics: { calls: 1250, latency: 45, rating: 4.8 },
      tags: ['networking', 'core', 'high-priority']
    },
    {
      name: 'Auth Service',
      description: 'User authentication and authorization module',
      status: 'active' as const,
      metrics: { calls: 890, latency: 23, rating: 4.9 },
      tags: ['security', 'essential']
    },
    {
      name: 'Data Pipeline',
      description: 'ETL and data processing workflows',
      status: 'pending' as const,
      metrics: { calls: 340, latency: 120 },
      tags: ['data', 'analytics']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">Module Cards Demo</h1>
        
        {/* Standard Cards */}
        <section>
          <h2 className="text-xl font-semibold text-gray-300 mb-4">Standard Module Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleModules.map((module, index) => (
              <ModuleCard
                key={index}
                {...module}
                onClick={() => console.log(`Clicked ${module.name}`)}
              />
            ))}
          </div>
        </section>

        {/* Compact Cards */}
        <section>
          <h2 className="text-xl font-semibold text-gray-300 mb-4">Compact Module Cards</h2>
          <div className="space-y-2 max-w-md">
            {sampleModules.map((module, index) => (
              <ModuleCardCompact
                key={index}
                name={module.name}
                status={module.status}
                metric={`${module.metrics.calls} calls`}
                onClick={() => console.log(`Clicked compact ${module.name}`)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ModuleCardDemo;