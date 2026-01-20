import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar = ({ logo, links, ctaText, onLogoClick, className, style }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = links || [];

  return (
    <nav
      className={`fixed w-full z-50 border-b border-gray-900 bg-black/95 backdrop-blur-md ${className || ''}`}
      style={style}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 h-16 md:h-20 flex items-center justify-between">

        {/* Logo Area */}
        <a
          href="/"
          onClick={(e) => {
            if (onLogoClick) {
              e.preventDefault();
              onLogoClick();
            }
          }}
          className="flex-shrink-0 flex items-center gap-3 group cursor-pointer"
        >
          {logo && (
            <img
              src={logo}
              alt="QuickStor Systems"
              className="h-8 md:h-10 w-auto object-contain rounded-sm"
            />
          )}
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-6 lg:gap-10 text-xs lg:text-sm font-medium text-gray-400">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="hover:text-blue-400 transition-colors relative group py-2"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 lg:px-8 rounded-sm skew-x-[-10deg] transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95 text-xs lg:text-sm">
            <span className="skew-x-[10deg] inline-block">{ctaText}</span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      <div className={`md:hidden absolute w-full bg-black border-b border-gray-800 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 space-y-4 flex flex-col items-center">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block w-full text-center py-2 text-gray-400 hover:text-blue-400 font-bold hover:bg-gray-900 rounded transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-sm mt-4 active:scale-95 transition-transform">
            {ctaText}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;