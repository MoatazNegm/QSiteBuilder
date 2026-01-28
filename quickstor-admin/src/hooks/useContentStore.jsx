import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { defaultContent } from '../../../quickstor-frontend/src/data/defaultContent';
import { defaultTheme } from '../config/defaultTheme';

import { db, doc, setDoc, getDoc } from '../firebase';

const ContentContext = createContext();

export const ContentProvider = ({ children }) => {
  // Global State - Initialize from LocalStorage or Default
  const [navbar, setNavbar] = useState(() => {
    const saved = localStorage.getItem('quickstor_navbar');
    return saved ? JSON.parse(saved) : (defaultContent.navbar || {});
  });

  const [footer, setFooter] = useState(() => {
    const saved = localStorage.getItem('quickstor_footer');
    return saved ? JSON.parse(saved) : (defaultContent.footer || {});
  });

  // Page State - Initialize from LocalStorage or Default
  const [pages, setPages] = useState(() => {
    const saved = localStorage.getItem('quickstor_pages');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'home',
        slug: '/',
        title: 'Home',
        sections: defaultContent.sections || []
      }
    ];
  });

  const [activePageId, setActivePageId] = useState('home');
  const [selectedSectionId, setSelectedSectionId] = useState(null);

  // Theme State - Initialize from LocalStorage or Default
  const [activeTheme, setActiveTheme] = useState(() => {
    const saved = localStorage.getItem('quickstor_activeTheme');
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  const [savedThemes, setSavedThemes] = useState(() => {
    const saved = localStorage.getItem('quickstor_savedThemes');
    return saved ? JSON.parse(saved) : [defaultTheme];
  });

  // Custom Sections Library - Start empty, Firestore is source of truth
  const [customSections, setCustomSections] = useState([]);

  // Change Tracking State
  const [stagingSnapshot, setStagingSnapshot] = useState(null); // Deep copy of what's in DB
  const [liveSnapshot, setLiveSnapshot] = useState(null);       // Deep copy of Live DB
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasPendingPublish, setHasPendingPublish] = useState(false);

  // Load ALL content from Firestore on startup (sync across browsers)
  // Load ALL content from Firestore on startup (sync across browsers)
  useEffect(() => {
    const loadFromFirestore = async () => {
      try {
        // 1. Fetch Staging
        const stagingRef = doc(db, 'sites', 'quickstor-staging');
        const stagingSnap = await getDoc(stagingRef);

        if (stagingSnap.exists()) {
          const data = stagingSnap.data();
          setStagingSnapshot(data);

          // Sync pages from Firestore
          if (data.pages && Array.isArray(data.pages)) {
            setPages(data.pages);
            localStorage.setItem('quickstor_pages', JSON.stringify(data.pages));
          }

          // Sync navbar from Firestore
          if (data.navbar) {
            setNavbar(data.navbar);
            localStorage.setItem('quickstor_navbar', JSON.stringify(data.navbar));
          }

          // Sync footer from Firestore
          if (data.footer) {
            setFooter(data.footer);
            localStorage.setItem('quickstor_footer', JSON.stringify(data.footer));
          }

          // Sync savedThemes from Firestore
          if (data.savedThemes && Array.isArray(data.savedThemes)) {
            setSavedThemes(data.savedThemes);
            localStorage.setItem('quickstor_savedThemes', JSON.stringify(data.savedThemes));
          }

          // Sync active theme
          if (data.theme) {
            setActiveTheme(data.theme);
            localStorage.setItem('quickstor_activeTheme', JSON.stringify(data.theme));
          }

          // Sync custom sections
          const firestoreSections = data.customSections && Array.isArray(data.customSections)
            ? data.customSections
            : [];
          setCustomSections(firestoreSections);
          localStorage.setItem('quickstor_custom_sections', JSON.stringify(firestoreSections));
        }

        // 2. Fetch Live (for comparison only)
        const liveSnap = await getDoc(doc(db, 'sites', 'quickstor-live'));
        if (liveSnap.exists()) {
          setLiveSnapshot(liveSnap.data());
        }

      } catch (error) {
        console.error('Error loading from Firestore:', error);
      }
    };

    loadFromFirestore();
  }, []);

  // --- Change Detection Logic ---

  // Refactored: Use explicit "Dirty Flag" for local changes and "Versioning" for Staging vs Live
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  // Check if Staging differs from Live via VERSION comparison (O(1) complexity)
  useEffect(() => {
    if (!stagingSnapshot || !liveSnapshot) {
      setHasPendingPublish(false);
      return;
    }

    // If versions are missing (legacy data), fallback to assuming they match or manual publish needed
    // But for new saves, we rely on version string equality
    const stagingVer = stagingSnapshot.version;
    const liveVer = liveSnapshot.version;

    console.log(`Version Check - Staging: ${stagingVer} | Live: ${liveVer}`);

    setHasPendingPublish(stagingVer !== liveVer);
  }, [stagingSnapshot, liveSnapshot]);

  // Helper to get active page
  const activePage = pages.find(p => p.id === activePageId) || pages[0];
  const sections = activePage?.sections || [];

  // --- Persistence Actions ---
  const saveContent = useCallback(async () => {
    // 1. Save locally as backup
    localStorage.setItem('quickstor_navbar', JSON.stringify(navbar));
    localStorage.setItem('quickstor_footer', JSON.stringify(footer));
    localStorage.setItem('quickstor_pages', JSON.stringify(pages));
    localStorage.setItem('quickstor_activeTheme', JSON.stringify(activeTheme));
    localStorage.setItem('quickstor_savedThemes', JSON.stringify(savedThemes));
    localStorage.setItem('quickstor_custom_sections', JSON.stringify(customSections));

    // 2. Publish to Firestore (STAGING)
    try {
      const stagingContentRef = doc(db, 'sites', 'quickstor-staging');

      // Generate Version ID (Time + Random) to guarantee uniqueness on every save
      const newVersion = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      const newData = {
        version: newVersion, // NEW: Explicit versioning
        navbar,
        footer,
        pages,
        theme: activeTheme,
        savedThemes: savedThemes,
        customSections: customSections,
        lastUpdated: new Date()
      };

      await setDoc(stagingContentRef, newData);

      // Update local snapshot after successful save
      setStagingSnapshot(newData);
      setIsDirty(false); // Reset dirty flag

      console.log('Content published to Firestore (Staging) with version:', newVersion);
      return true;
    } catch (error) {
      console.error('Error publishing to Firestore:', error);
      alert('Failed to publish to staging: ' + error.message);
      return false;
    }
  }, [navbar, footer, pages, activeTheme, savedThemes, customSections]);

  // --- Staging -> Live Actions ---

  const publishStagingToLive = useCallback(async () => {
    try {
      // 1. Get current staging data
      const stagingSnap = await getDoc(doc(db, 'sites', 'quickstor-staging'));
      if (!stagingSnap.exists()) {
        throw new Error("No staging content found to publish.");
      }
      const data = stagingSnap.data();

      // 2. Write to live
      await setDoc(doc(db, 'sites', 'quickstor-live'), {
        ...data,
        lastPublished: new Date()
      });

      // Update Live snapshot to match
      setLiveSnapshot(data);

      console.log('Staging content promoted to Live');
      return true;
    } catch (error) {
      console.error('Error publishing to live:', error);
      alert('Failed to publish to live: ' + error.message);
      return false;
    }
  }, []);

  const rejectStaging = useCallback(async () => {
    if (!confirm("Are you sure? This will overwrite your current staging (draft) work with the content currently on the Live site.")) {
      return false;
    }
    try {
      // 1. Get current live data
      const liveSnap = await getDoc(doc(db, 'sites', 'quickstor-live'));
      if (!liveSnap.exists()) {
        throw new Error("No live content found to revert to.");
      }
      const data = liveSnap.data();

      // 2. Update local state to match live, BUT preserve Custom Sections (Library)
      if (data.navbar) setNavbar(data.navbar);
      if (data.footer) setFooter(data.footer);
      if (data.pages) setPages(data.pages);
      if (data.theme) setActiveTheme(data.theme);
      if (data.savedThemes) setSavedThemes(data.savedThemes);
      // Preserve current customSections instead of reverting to Live
      // if (data.customSections) setCustomSections(data.customSections); 

      const revertedData = {
        ...data,
        customSections: customSections // Keep existing library additions
      };

      // 3. Update staging in Firestore to match live (with preserved sections)
      await setDoc(doc(db, 'sites', 'quickstor-staging'), revertedData);

      // Update snapshots
      setStagingSnapshot(data);
      setLiveSnapshot(data);

      console.log('Staging reverted to match Live');
      return true;
    } catch (error) {
      console.error('Error rejecting staging:', error);
      alert('Failed to revert staging: ' + error.message);
      return false;
    }
  }, []);

  const discardChanges = useCallback(() => {
    if (!confirm('Are you sure you want to discard all unsaved changes over your current session?')) return;

    // Revert logic...
    // Also reset dirty flag
    setIsDirty(false);

    // ... rest of discard logic (using saved locals)
    // Actually, deeper revert to STAGING snapshot might be safer if we want "Reset to Saved State"
    // But keeping existing localStorage revert for now as per previous logic
    const savedNavbar = localStorage.getItem('quickstor_navbar');
    setNavbar(savedNavbar ? JSON.parse(savedNavbar) : (defaultContent.navbar || {}));

    const savedFooter = localStorage.getItem('quickstor_footer');
    setFooter(savedFooter ? JSON.parse(savedFooter) : (defaultContent.footer || {}));

    const savedPages = localStorage.getItem('quickstor_pages');
    if (savedPages) {
      setPages(JSON.parse(savedPages));
    } else {
      setPages([{
        id: 'home',
        slug: '/',
        title: 'Home',
        sections: defaultContent.sections || []
      }]);
    }
    setActivePageId('home');

    // Safety: ensure using snapshot if local storage is stale? 
    if (stagingSnapshot) {
      if (stagingSnapshot.navbar) setNavbar(stagingSnapshot.navbar);
      if (stagingSnapshot.footer) setFooter(stagingSnapshot.footer);
      if (stagingSnapshot.pages) setPages(stagingSnapshot.pages);
      // ... etc
    }
  }, [stagingSnapshot]);

  // --- Page Actions ---

  const addPage = useCallback((title, slug) => {
    markDirty();
    const newPage = {
      id: `page-${Date.now()}`,
      title,
      slug: slug.startsWith('/') ? slug : `/${slug}`,
      sections: []
    };
    setPages(prev => [...prev, newPage]);
    setActivePageId(newPage.id);
    setSelectedSectionId(null);
  }, [markDirty]);

  const deletePage = useCallback((id) => {
    if (id === 'home') return; // Cannot delete home
    markDirty();
    setPages(prev => {
      const newPages = prev.filter(p => p.id !== id);
      return newPages;
    });
    if (activePageId === id) setActivePageId('home');
  }, [activePageId, markDirty]);

  const updatePage = useCallback((id, updates) => {
    markDirty();
    setPages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [markDirty]);

  // --- Global Actions (Navbar/Footer) ---

  const updateNavbar = useCallback((newConfig) => {
    markDirty();
    setNavbar(prev => ({ ...prev, ...newConfig }));
  }, [markDirty]);

  const updateFooter = useCallback((newConfig) => {
    markDirty();
    setFooter(prev => ({ ...prev, ...newConfig }));
  }, [markDirty]);

  // --- Theme Actions ---

  const updateTheme = useCallback((updates) => {
    markDirty();
    setActiveTheme(prev => ({
      ...prev,
      ...updates,
      colors: { ...prev.colors, ...(updates.colors || {}) },
      fonts: { ...prev.fonts, ...(updates.fonts || {}) },
      hero: { ...prev.hero, ...(updates.hero || {}) }
    }));
  }, [markDirty]);

  const saveThemeToLibrary = useCallback((name) => {
    markDirty();
    const newTheme = {
      ...activeTheme,
      id: `theme-${Date.now()}`,
      name: name || `Theme ${savedThemes.length + 1}`
    };
    const updatedThemes = [...savedThemes, newTheme];
    setSavedThemes(updatedThemes);
    // Persist immediately
    localStorage.setItem('quickstor_savedThemes', JSON.stringify(updatedThemes));
    return newTheme;
  }, [activeTheme, savedThemes, markDirty]);

  const deleteThemeFromLibrary = useCallback((themeId) => {
    if (themeId === 'default') return; // Cannot delete default theme
    markDirty();
    const updatedThemes = savedThemes.filter(t => t.id !== themeId);
    setSavedThemes(updatedThemes);
    // Persist immediately
    localStorage.setItem('quickstor_savedThemes', JSON.stringify(updatedThemes));
    // If deleted theme was active, revert to default
    if (activeTheme.id === themeId) {
      setActiveTheme(defaultTheme);
      localStorage.setItem('quickstor_activeTheme', JSON.stringify(defaultTheme));
    }
  }, [activeTheme.id, savedThemes, markDirty]);

  const applyTheme = useCallback((theme) => {
    markDirty();
    setActiveTheme(theme);
    // Persist immediately
    localStorage.setItem('quickstor_activeTheme', JSON.stringify(theme));
  }, [markDirty]);

  const updateSection = useCallback((id, newContent) => {
    markDirty(); // Flag as unsaved
    setPages(prev => prev.map(page => {
      if (page.id !== activePageId) return page;
      return {
        ...page,
        sections: page.sections.map(section =>
          section.id === id ? { ...section, content: newContent } : section
        )
      };
    }));
  }, [activePageId, markDirty]);

  const reorderSections = useCallback((newOrder) => {
    markDirty(); // Flag as unsaved
    setPages(prev => prev.map(page => {
      if (page.id !== activePageId) return page;
      return { ...page, sections: newOrder };
    }));
  }, [activePageId, markDirty]);

  // ACTION: Add a new section with SAFE DEFAULTS
  const addSection = useCallback((type, customProps = null) => {
    markDirty(); // Flag as unsaved
    const newId = `${type.toLowerCase()}-${Date.now()}`;

    // Provide default content structure to prevent crashes in the preview
    let defaultProps = {};

    if (type === 'COMPARISON_GRAPH') {
      defaultProps = {
        title: 'New Comparison Graph',
        description: 'Edit this text to describe your performance metrics.',
        data: [
          { name: 'Competitor A', iops: 50, throughput: 100 },
          { name: 'Competitor B', iops: 80, throughput: 150 },
          { name: 'QuickStor', iops: 200, throughput: 500 }
        ]
      };
    } else if (type === 'FEATURE_GRID') {
      defaultProps = {
        features: [
          { icon: 'Shield', title: 'New Feature 1', description: 'Description here.' },
          { icon: 'Zap', title: 'New Feature 2', description: 'Description here.' },
          { icon: 'Cpu', title: 'New Feature 3', description: 'Description here.' }
        ]
      };
    } else if (type === 'HERO') {
      defaultProps = {
        badge: 'NEW',
        title: { line1: 'Brand New', highlight: 'Section' },
        subtitle: 'This is a new hero section.',
        primaryCta: 'Action',
        secondaryCta: 'Learn More'
      };
    } else if (type === 'CUSTOM_HTML') {
      // For custom HTML sections, use provided props or placeholder
      defaultProps = customProps || {
        html: '<section class="py-20 bg-[#050505] text-center"><p class="text-gray-400">Custom section - edit to add content</p></section>'
      };
    }

    const newSection = {
      id: newId,
      type: type,
      content: customProps || defaultProps
    };

    setPages(prev => prev.map(page => {
      if (page.id !== activePageId) return page;
      return { ...page, sections: [...page.sections, newSection] };
    }));

    setSelectedSectionId(newId);
  }, [activePageId, markDirty]);

  const deleteSection = useCallback((id) => {
    markDirty(); // Flag as unsaved
    setPages(prev => prev.map(page => {
      if (page.id !== activePageId) return page;
      return { ...page, sections: page.sections.filter(s => s.id !== id) };
    }));
    if (selectedSectionId === id) setSelectedSectionId(null);
  }, [activePageId, selectedSectionId, markDirty]);

  return (
    <ContentContext.Provider value={{
      // Page State
      pages,
      activePageId,
      activePage,
      setActivePageId,
      addPage,
      deletePage,
      updatePage,

      // Global State
      navbar,
      footer,
      updateNavbar,
      updateFooter,

      // Section State (Derived from Active Page)
      sections,
      selectedSectionId,
      setSelectedSectionId,
      updateSection,
      reorderSections,
      addSection,
      deleteSection,

      // Theme State
      activeTheme,
      savedThemes,
      updateTheme,
      saveThemeToLibrary,
      deleteThemeFromLibrary,
      applyTheme,

      // Custom Sections Library
      customSections,
      setCustomSections,

      // Persistence
      // Persistence
      saveContent,
      discardChanges,

      // Staging Workflow
      publishStagingToLive,
      rejectStaging,

      // State Flags
      // State Flags
      hasUnsavedChanges: isDirty, // Map the isDirty flag to context property so components don't need changes
      hasPendingPublish
    }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContentStore = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContentStore must be used within a ContentProvider');
  }
  return context;
};