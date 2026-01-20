// This file acts as your "database" for now. 
// Later, you will fetch this JSON from your API.

import logo from '../assets/Quickstor logo.png';

export const defaultContent = {
  // Global/Fixed elements (Layout)
  navbar: {
    logo: logo,
    links: [
      { label: 'PERFORMANCE', href: '#performance' },
      { label: 'ZFS TECHNOLOGY', href: '#zfs' },
      { label: 'SOLUTIONS', href: '#solutions' },
      { label: 'SUPPORT', href: '#support' }
    ],
    ctaText: 'BUILD SERVER'
  },
  
  // Dynamic Sections (Reorderable)
  sections: [
    {
      id: 'hero-main',
      type: 'HERO',
      content: {
        badge: 'V 2.0 // ENTERPRISE READY',
        title: {
          line1: 'DATA AT THE',
          highlight: 'SPEED OF LIGHT.'
        },
        subtitle: 'Stop waiting for legacy NAS. QuickStor deploys enterprise-grade ZFS mirroring and RAID-Z3 on bare-metal hardware.',
        primaryCta: 'VIEW CONFIGURATIONS',
        secondaryCta: 'WHY ZFS?',
        trustIndicators: [
          { icon: 'ShieldCheck', text: '99.999% UPTIME' },
          { icon: 'Lock', text: 'AES-256 ENCRYPTED' }
        ],
        serverStatus: {
          status: 'ONLINE',
          scrub: 'SCRUB_COMPLETED',
          dedup: '1.45x'
        }
      }
    },
    {
      id: 'comparison-graph-1',
      type: 'COMPARISON_GRAPH',
      content: {
        title: 'DOMINATE THE BENCHMARKS',
        description: "We don't just sell storage; we sell IOPS. By optimizing the ZFS Adaptive Replacement Cache (ARC) and leveraging NVMe L2ARC, QuickStor servers saturate 100GbE links while competitors struggle to fill 10GbE.",
        data: [
          { name: 'Competitor Q', iops: 45000, throughput: 2200 },
          { name: 'Competitor S', iops: 42000, throughput: 2100 },
          { name: 'QuickStor Z-Series', iops: 125000, throughput: 6500 }
        ]
      }
    },
    {
      id: 'features-main',
      type: 'FEATURE_GRID',
      content: {
        features: [
          {
            icon: 'ShieldCheck',
            title: 'Self-Healing Data',
            description: 'Every block is checksummed. If ZFS detects silent data corruption ("bit rot"), it automatically repairs the damaged data from parity before you even know it happened.'
          },
          {
            icon: 'Cpu',
            title: 'Open Hardware',
            description: 'No proprietary RAID cards. No vendor lock-in. If a controller fails, plug your drives into any standard HBA and your data is accessible instantly.'
          },
          {
            icon: 'Activity',
            title: 'Intelligent Tiering',
            description: 'Hybrid Storage Pools automatically route hot data to NVMe/SSD and cold data to high-capacity HDDs, giving you flash speed at spinning-disk prices.'
          }
        ]
      }
    }
  ],

  // Global/Fixed elements (Layout)
  footer: {
    brandName: 'QUICKSTOR',
    brandDescription: 'High-performance ZFS storage appliances for enterprise, media production, and big data.',
    tagline: 'Engineered in Giza. Deployed Globally.',
    columns: [
      {
        title: 'Hardware',
        links: ['Z-Series (Performance)', 'C-Series (Capacity)', 'All-Flash NVMe', 'JBOD Expansion']
      },
      {
        title: 'Resources',
        links: ['ZFS Whitepaper', 'Benchmark Results', 'Documentation', 'Support Portal']
      },
      {
        title: 'Contact',
        links: ['Sales Online', 'sales@quickstor.net', '+20 100 000 0000']
      }
    ],
    copyright: '© 2024 QuickStor Systems. All rights reserved.',
    legalLinks: ['Privacy', 'Terms', 'SLA']
  }
};