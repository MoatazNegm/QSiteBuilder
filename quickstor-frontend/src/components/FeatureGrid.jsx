import React from 'react';
import { IconMapper } from '../utils/IconMapper';

const FeatureGrid = ({ features, styles = {} }) => (
  <section id="zfs" className="py-16 md:py-24 bg-[#050505] px-4 sm:px-6 lg:px-12">
    <div className="max-w-screen-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">

        {features.map((feature, index) => (
          <div key={index} className="p-6 md:p-8 bg-[#0a0a0a] rounded-xl border border-gray-800 hover:border-blue-600 transition-all group">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-900 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <IconMapper
                name={feature.icon}
                className="text-blue-500 group-hover:text-white"
                size={24}
              />
            </div>
            <h3
              style={styles?.cardTitle}
              className="text-lg md:text-xl font-bold text-white mb-3"
            >
              {feature.title}
            </h3>
            <p
              style={styles?.cardDescription}
              className="text-gray-400 text-sm leading-relaxed"
            >
              {feature.description}
            </p>
          </div>
        ))}

      </div>
    </div>
  </section>
);

export default FeatureGrid;