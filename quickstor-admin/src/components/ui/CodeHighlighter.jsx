/**
 * Professional Code Highlighter using Prism
 * Provides VS Code-quality syntax highlighting
 */

import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';

/**
 * CodeHighlighter Component
 * Renders syntax-highlighted code with line numbers
 */
export function CodeHighlighter({ code, language = 'markup', className = '' }) {
    return (
        <Highlight theme={themes.vsDark} code={code} language={language}>
            {({ className: preClassName, style, tokens, getLineProps, getTokenProps }) => (
                <pre
                    className={`${preClassName} ${className} p-4 text-sm overflow-auto h-full`}
                    style={{ ...style, margin: 0, background: '#1e1e2e' }}
                >
                    {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })} className="table-row">
                            {/* Line number */}
                            <span className="table-cell text-right pr-4 select-none text-gray-600 text-xs w-8">
                                {i + 1}
                            </span>
                            {/* Code content */}
                            <span className="table-cell">
                                {line.map((token, key) => (
                                    <span key={key} {...getTokenProps({ token })} />
                                ))}
                            </span>
                        </div>
                    ))}
                </pre>
            )}
        </Highlight>
    );
}

export default CodeHighlighter;
