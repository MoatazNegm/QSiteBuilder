import React, { useMemo, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

const CustomHTMLSection = ({ html, css, js, content, styles }) => {
    const containerRef = useRef(null);

    // Clean up content to prevent "undefined" strings
    const cleanHtml = html || '';
    const cleanCss = css || '';

    // Parse HTML and inject content if provided
    const processedHtml = useMemo(() => {
        let result = cleanHtml;
        if (content && typeof content === 'object') {
            Object.entries(content).forEach(([key, value]) => {
                const regex = new RegExp(`{{${key}}}`, 'g');

                // Check if we have styles for this key
                const fieldStyles = styles && styles[key];

                if (fieldStyles && Object.keys(fieldStyles).length > 0) {
                    // Construct style string (kebab-case for raw HTML)
                    const styleString = Object.entries(fieldStyles)
                        .map(([prop, val]) => {
                            const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                            return `${cssProp}:${val}`;
                        })
                        .join(';');

                    result = result.replace(regex, `<span style="${styleString}">${value}</span>`);
                } else {
                    result = result.replace(regex, value);
                }
            });
        }
        return result;
    }, [cleanHtml, content, styles]);

    // Execute scripts found in the HTML
    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const scripts = Array.from(container.querySelectorAll('script'));

        const externalScripts = scripts.filter(s => s.src);
        const inlineScripts = scripts.filter(s => !s.src);

        // Helper to load a script
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                // Check if already actively loaded (or loading) by us
                if (document.querySelector(`script[src="${src}"][data-injected="true"]`)) {
                    if (src.includes('chart.js')) {
                        if (window.Chart) {
                            resolve();
                            return;
                        }
                        // Poll for it
                        const interval = setInterval(() => {
                            if (window.Chart) {
                                clearInterval(interval);
                                resolve();
                            }
                        }, 100);
                        // Timeout fallback
                        setTimeout(() => {
                            clearInterval(interval);
                            resolve(); // Proceed anyway
                        }, 10000); // Increased timeout
                        return;
                    }
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = src;
                script.dataset.injected = "true"; // Mark as active
                script.onload = () => {
                    resolve();
                };
                script.onerror = (e) => {
                    reject(e);
                };
                script.async = false;
                document.body.appendChild(script);
            });
        };

        // Helper to unwrap DOMContentLoaded and add error handling
        const processInlineScript = (content) => {
            // Strategy: Replace "document.addEventListener('DOMContentLoaded', fn)" with "(fn)()"
            // This avoids parsing the function body which is error-prone with regex.

            let newContent = content;

            // Check if we have the listener
            if (content.includes('DOMContentLoaded')) {
                // Replace document.addEventListener('DOMContentLoaded', ...)
                // We replace the function call part with a wrapper that executes the callback immediately.
                // Match: (doc|win).addEventListener('DOMContentLoaded', 
                newContent = newContent.replace(
                    /(?:document|window)\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*/g,
                    '(function(e,cb){cb();})("DOMContentLoaded",'
                );
            }

            // Wrap in try-catch to log errors
            return `
            (function() {
                try {
                    ${newContent}
                } catch (e) {
                    console.error('[CustomHTMLSection] Inline script execution error:', e);
                }
            })();
            `;
        };

        // Load all external scripts first
        Promise.all(externalScripts.map(s => loadScript(s.src)))
            .then(() => {

                // CRITICAL: Destroy existing charts on canvases within this container
                // This prevents "Canvas is already in use" errors when React re-renders or Strict Mode runs effects twice.
                if (window.Chart) {
                    const canvases = container.querySelectorAll('canvas');
                    canvases.forEach(canvas => {
                        const existingChart = window.Chart.getChart(canvas);
                        if (existingChart) {
                            existingChart.destroy();
                        }
                    });
                }

                // Then execute inline scripts
                inlineScripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    const processedParam = processInlineScript(oldScript.innerHTML);
                    newScript.appendChild(document.createTextNode(processedParam));
                    document.body.appendChild(newScript);
                });
            })
            .catch(err => {
                console.error('[CustomHTMLSection] Failed to load external scripts:', err);
            });

        return () => {
            // Cleanup intentionally skipped for body scripts to persist
        };
    }, [processedHtml]);

    return (
        <div className="custom-section-wrapper" ref={containerRef}>
            {cleanCss && (
                <style dangerouslySetInnerHTML={{ __html: cleanCss }} />
            )}
            <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
        </div>
    );
};

export default CustomHTMLSection;
