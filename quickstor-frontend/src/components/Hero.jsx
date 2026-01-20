import React from 'react';
import { ArrowRight, Activity } from 'lucide-react';
import { IconMapper } from '../utils/IconMapper';

const Hero = ({ badge, title, subtitle, primaryCta, secondaryCta, trustIndicators, serverStatus, styles = {} }) => {
  return (
    <section className="relative pt-24 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 lg:px-12 min-h-screen flex items-center bg-[#050505] overflow-hidden">
      {/* Abstract Tech Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#1e3a8a 1px, transparent 1px), linear-gradient(90deg, #1e3a8a 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}>
      </div>

      {/* Glowing Orb Effect */}
      <div className="absolute top-1/4 right-0 w-[300px] md:w-[500px] lg:w-[800px] h-[300px] md:h-[500px] lg:h-[800px] bg-blue-600/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>

      <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10 w-full">

        {/* Text Content */}
        <div className="text-center lg:text-left">
          {badge && (
            <div
              style={styles?.badge}
              className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-blue-500/30 bg-blue-900/10 rounded-full text-blue-400 text-[10px] md:text-xs font-mono tracking-widest"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              {badge}
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
            <span style={styles?.titleLine1}>{title?.line1}</span> <br className="hidden sm:block" />
            <span
              style={styles?.titleHighlight}
              className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400"
            >
              {title?.highlight}
            </span>
          </h1>

          <p
            style={styles?.subtitle}
            className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed lg:border-l-2 border-blue-900 lg:pl-6 border-l-0"
          >
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              style={styles?.primaryCta}
              className="bg-white text-black font-bold py-3 md:py-4 px-6 md:px-8 rounded-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 group text-sm md:text-base"
            >
              {primaryCta}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              style={styles?.secondaryCta}
              className="border border-gray-700 text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded-sm hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors text-sm md:text-base"
            >
              {secondaryCta}
            </button>
          </div>

          {/* Mini Trust Indicators */}
          {trustIndicators && (
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-8 text-gray-500 text-xs sm:text-sm font-mono">
              {trustIndicators.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <IconMapper name={item.icon} size={16} />
                  {item.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3D Server Visualization Placeholder */}
        <div className="relative group perspective-1000 w-full max-w-md mx-auto lg:max-w-full mt-8 lg:mt-0">
          <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#0a0a0a] border border-gray-800 aspect-[4/3] rounded-xl flex flex-col items-center justify-center p-4 sm:p-8 shadow-2xl overflow-hidden">

            {/* Simulated Server Rack UI */}
            <div className="w-full max-w-sm space-y-3 sm:space-y-4 scale-90 sm:scale-100">
              {/* Server Unit 1 */}
              <div className="bg-[#151515] border border-gray-800 p-3 sm:p-4 rounded flex items-center justify-between group-hover:border-blue-500/50 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex gap-1">
                    <div className="w-1 h-6 sm:h-8 bg-blue-500 animate-pulse"></div>
                    <div className="w-1 h-6 sm:h-8 bg-blue-500/50"></div>
                  </div>
                  <div>
                    <div className="h-2 w-16 sm:w-24 bg-gray-700 rounded mb-2"></div>
                    <div className="h-2 w-10 sm:w-16 bg-gray-800 rounded"></div>
                  </div>
                </div>
                <Activity className="text-blue-500 animate-pulse" size={16} />
              </div>

              {/* Server Unit 2 */}
              <div className="bg-[#151515] border border-gray-800 p-3 sm:p-4 rounded flex items-center justify-between opacity-70">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex gap-1">
                    <div className="w-1 h-6 sm:h-8 bg-green-500/50"></div>
                    <div className="w-1 h-6 sm:h-8 bg-green-500/20"></div>
                  </div>
                  <div>
                    <div className="h-2 w-16 sm:w-24 bg-gray-700 rounded mb-2"></div>
                    <div className="h-2 w-10 sm:w-16 bg-gray-800 rounded"></div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>

              {/* Abstract Data Stream */}
              {serverStatus && (
                <div className="absolute top-0 right-0 p-3 sm:p-4 font-mono text-[8px] sm:text-[10px] text-blue-500/40 text-right">
                  ZFS_POOL_STATUS: {serverStatus.status}<br />
                  SCRUB: {serverStatus.scrub}<br />
                  DEDUP_RATIO: {serverStatus.dedup}
                </div>
              )}
            </div>

            <p className="mt-6 sm:mt-8 text-gray-500 font-mono text-[10px] sm:text-xs tracking-widest">[ QS-4U-MAX RENDER ]</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
