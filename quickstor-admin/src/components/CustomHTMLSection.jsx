/**
 * CustomHTMLSection Component
 * Renders AI-generated custom HTML sections with dynamic content interpolation
 */

import React, { useMemo, useEffect, useRef } from 'react';

const CustomHTMLSection = ({ html, css, content = {}, styles = {}, className = '' }) => {
    const containerRef = useRef(null);

    // Interpolate content into HTML
    const finalHtml = useMemo(() => {
        if (!html) return '';
        let processed = html;
        Object.entries(content).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');

            // Check for styles
            const fieldStyles = styles[key];
            if (fieldStyles && Object.keys(fieldStyles).length > 0) {
                // Construct style string
                const styleString = Object.entries(fieldStyles)
                    .map(([prop, val]) => {
                        // Convert camelCase to kebab-case (e.g. fontSize -> font-size) is NOT strictly needed for React inline styles, 
                        // BUT here we are generating raw HTML string to inject. So we DO need standard CSS syntax.
                        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                        return `${cssProp}:${val}`;
                    })
                    .join(';');

                processed = processed.replace(regex, `<span style="${styleString}">${value || ''}</span>`);
            } else {
                // Default behavior
                processed = processed.replace(regex, value || '');
            }
        });
        return processed;
    }, [html, content, styles]);

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
                        const interval = setInterval(() => {
                            if (window.Chart) {
                                clearInterval(interval);
                                resolve();
                            }
                        }, 100);
                        setTimeout(() => { clearInterval(interval); resolve(); }, 10000);
                        return;
                    }
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = src;
                script.dataset.injected = "true";
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
            let newContent = content;

            if (content.includes('DOMContentLoaded')) {
                newContent = newContent.replace(
                    /(?:document|window)\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*/g,
                    '(function(e,cb){cb();})("DOMContentLoaded",'
                );
            }

            return `
            (function() {
                try {
                    ${newContent}
                } catch (e) {
                    console.error('[CustomHTMLSection Admin] Inline script execution error:', e);
                }
            })();
            `;
        };

        // Load all external scripts first
        Promise.all(externalScripts.map(s => loadScript(s.src)))
            .then(() => {

                // CRITICAL: Destroy existing charts on canvases within this container
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
                console.error('[CustomHTMLSection Admin] Failed to load external scripts:', err);
            });

        return () => {
            // Cleanup skipped
        };
    }, [finalHtml]);

    if (!html) {
        return (
            <section className="py-20 bg-[#050505] flex items-center justify-center">
                <p className="text-gray-400">No content available</p>
            </section>
        );
    }

    return (
        <div className={`custom-section-wrapper ${className}`} ref={containerRef}>
            {css && (
                <style dangerouslySetInnerHTML={{ __html: css }} />
            )}
            <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
        </div>
    );
};

export default CustomHTMLSection;
