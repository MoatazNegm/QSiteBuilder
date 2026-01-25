import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ContentProvider } from './hooks/useContentStore';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import AuthLayout from './components/layout/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import SectionLibrary from './pages/SectionLibrary';
import SectionCreator from './pages/SectionCreator';
import ThemeEditor from './pages/ThemeEditor';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';

import { useEffect } from 'react';
import { promptService } from './utils/promptService';

function App() {
  useEffect(() => {
    promptService.init();
  }, []);

  // Determine basename (for serving under /adminportal)
  const basename = import.meta.env.BASE_URL || '/';

  return (
    <ContentProvider>
      <BrowserRouter basename={basename === '/' ? undefined : basename}>
        <Routes>
          {/* Public Routes (Login) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected Routes (Dashboard & Tools) */}
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />

            {/* New Routes */}
            <Route path="/sections" element={<SectionLibrary />} />
            <Route path="/sections/new" element={<SectionCreator />} />
            <Route path="/themes" element={<ThemeEditor />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ContentProvider>
  );
}

export default App;