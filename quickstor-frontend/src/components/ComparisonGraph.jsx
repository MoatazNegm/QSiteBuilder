import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Zap, Layers } from 'lucide-react';

const ComparisonGraph = ({ title, description, data }) => {
  return (
    <section id="performance" className="py-16 md:py-24 bg-[#080808] border-y border-gray-900 relative">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="mb-12 md:mb-16 md:w-2/3 mx-auto md:mx-0 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">{title}</h2>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-3xl">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Chart 1: IOPS */}
          <div className="bg-[#0e0e0e] p-4 sm:p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors">
            <h3 className="text-xs sm:text-sm font-mono text-blue-400 mb-6 flex items-center gap-2 tracking-widest uppercase">
              <Zap size={16} />
              Random Write 4K (IOPS)
            </h3>
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="iops" barSize={20} radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? '#2563eb' : '#333'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Throughput */}
          <div className="bg-[#0e0e0e] p-4 sm:p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors">
            <h3 className="text-xs sm:text-sm font-mono text-blue-400 mb-6 flex items-center gap-2 tracking-widest uppercase">
              <Layers size={16} />
              Sequential Read (MB/s)
            </h3>
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="throughput" barSize={20} radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? '#2563eb' : '#333'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonGraph;