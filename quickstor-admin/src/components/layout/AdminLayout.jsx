import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Settings, Menu, X, ChevronDown, ChevronRight, Plus, FileText, Library, Palette, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useContentStore } from '../../hooks/useContentStore';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { pages, activePageId, setActivePageId, addPage, deletePage } = useContentStore();

  const [isPagesOpen, setIsPagesOpen] = useState(true); // Default open to show pages

  const handleAddPage = (e) => {
    e.preventDefault();
    const newPageTitle = prompt("Enter new page title:");
    if (newPageTitle) {
      const slug = newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      addPage(newPageTitle, slug);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full h-16 bg-black border-b border-gray-800 z-40 flex items-center justify-between px-4 shadow-md">
        <span className="text-lg font-bold tracking-wider text-blue-500">QUICKSTOR</span>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-400 hover:text-white p-1"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-black text-white flex flex-col border-r border-gray-800 transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-800 hidden md:block">
          <h1 className="text-xl font-bold tracking-wider text-blue-500">QUICKSTOR</h1>
          <p className="text-xs text-gray-500 mt-1">Admin Console</p>
        </div>

        {/* Mobile Sidebar Header */}
        <div className="md:hidden h-16 flex items-center px-6 border-b border-gray-800 bg-black/50">
          <span className="text-sm font-medium text-gray-400">Menu</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">

          {/* Page Builder Group */}
          <div>
            <button
              onClick={() => setIsPagesOpen(!isPagesOpen)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-md text-sm text-gray-400 hover:text-white hover:bg-gray-900 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard size={18} className="group-hover:text-blue-400 transition-colors" />
                Page Builder
              </div>
              {isPagesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {/* Sub-menu for Pages */}
            {isPagesOpen && (
              <div className="mt-1 ml-4 pl-4 border-l border-gray-800 space-y-1">
                {pages.map((page) => {
                  const isActive = activePageId === page.id;
                  return (
                    <div key={page.id} className="relative group flex items-center">
                      <button
                        onClick={() => {
                          setActivePageId(page.id);
                          setIsSidebarOpen(false);
                          navigate('/');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 w-full text-left rounded-md text-xs transition-all border ${isActive
                          ? 'bg-blue-600/10 border-blue-600/20 text-white hover:text-white shadow-sm'
                          : 'border-transparent text-gray-400 hover:bg-gray-900 hover:border-gray-800 hover:text-white'
                          }`}
                      >
                        <FileText
                          size={14}
                          className={`transition-colors ${isActive
                            ? "text-blue-400"
                            : "text-gray-600 group-hover:text-gray-300"
                            }`}
                        />
                        {page.title}
                      </button>

                      {/* Delete Button */}
                      {page.id !== 'home' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete page "${page.title}"? This cannot be undone.`)) {
                              deletePage(page.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded absolute right-1 transition-all"
                          title="Delete Page"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={handleAddPage}
                  className="flex items-center gap-2 px-4 py-2 w-full text-left rounded-md text-xs text-white border border-transparent hover:border-blue-500/50 hover:bg-blue-900/10 transition-all mt-2"
                >
                  <Plus size={14} className="text-blue-500" /> Add a Page
                </button>
              </div>
            )}
          </div>

          {/* Section Library Link */}
          <Link
            to="/sections"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-colors ${location.pathname.startsWith('/sections')
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
          >
            <Library size={18} />
            Section Library
          </Link>

          {/* Theme Editor Link */}
          <Link
            to="/themes"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-colors ${location.pathname === '/themes'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
          >
            <Palette size={18} />
            Theme Editor
          </Link>

          {/* Settings Link */}
          <Link
            to="/settings"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-colors ${location.pathname === '/settings'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
          >
            <Settings size={18} />
            Settings
          </Link>

        </nav>

        <div className="p-4 border-t border-gray-800">
          <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 hover:border-red-900/30 gap-3">
            <LogOut size={18} />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0 w-full relative">
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)] md:min-h-screen">
          <Outlet />
        </div>
      </main>
    </div >
  );
};

export default AdminLayout;