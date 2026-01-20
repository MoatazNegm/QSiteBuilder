import React from 'react';
import { HardDrive } from 'lucide-react';

const Footer = ({ brandName, brandDescription, tagline, columns, copyright, legalLinks }) => (
  <footer className="bg-black py-12 md:py-16 border-t border-gray-900">
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-sm text-center sm:text-left">
      <div className="col-span-1 sm:col-span-2 md:col-span-1 flex flex-col items-center sm:items-start">
        <div className="text-white font-bold text-xl mb-6 flex items-center gap-2">
           <HardDrive size={24} className="text-blue-600" />
           {brandName}
        </div>
        <p className="text-gray-500 mb-6 max-w-xs sm:max-w-full">
          {brandDescription}
        </p>
        <div className="text-gray-600 text-xs">
          {tagline}
        </div>
      </div>
      
      {columns.map((col, index) => (
        <div key={index}>
          <h4 className="text-white font-bold mb-6 tracking-wider text-xs uppercase">{col.title}</h4>
          <ul className="space-y-4 text-gray-500 flex flex-col items-center sm:items-start">
            {col.links.map((link, linkIndex) => (
              <li key={linkIndex} className="hover:text-blue-500 cursor-pointer transition-colors flex items-center gap-2">
                {col.title === 'Contact' && linkIndex === 0 && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                {link}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 mt-16 pt-8 border-t border-gray-900 flex flex-col-reverse md:flex-row justify-between items-center text-gray-600 text-xs gap-6 md:gap-0">
      <p>{copyright}</p>
      <div className="flex gap-6">
        {legalLinks.map((link, index) => (
          <span key={index} className="cursor-pointer hover:text-gray-400">{link}</span>
        ))}
      </div>
    </div>
  </footer>
);

export default Footer;