import React from 'react';
import { useContentStore } from '../../hooks/useContentStore';
import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import StyleControls from '../../components/ui/StyleControls';
import { Trash2, Plus, Settings2 } from 'lucide-react';
import ImageUploadField from '../../components/ui/ImageUploadField';

const PropertyPanel = () => {
  const { sections, selectedSectionId, updateSection, navbar, updateNavbar, footer, updateFooter, pages } = useContentStore();

  // Helper to determine what we are editing
  const isNavbar = selectedSectionId === 'NAVBAR';
  const isFooter = selectedSectionId === 'FOOTER';
  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // If nothing selected and not special section, show placeholder
  if (!selectedSection && !isNavbar && !isFooter) {
    return (
      <div className="w-80 border-l border-gray-200 bg-white p-8 flex flex-col items-center justify-center text-center text-gray-500 h-full">
        <p>Select a section to edit properties</p>
      </div>
    );
  }

  // --- Navbar Editor ---
  const renderNavbarEditor = () => {
    const updateLink = (index, field, value) => {
      const newLinks = [...navbar.links];
      newLinks[index] = { ...newLinks[index], [field]: value };
      updateNavbar({ links: newLinks });
    };

    const addLink = () => {
      updateNavbar({ links: [...navbar.links, { label: 'New Link', href: '#' }] });
    };

    const removeLink = (index) => {
      const newLinks = navbar.links.filter((_, i) => i !== index);
      updateNavbar({ links: newLinks });
    };

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Logo Text / Path</Label>
          <Input
            value={navbar.logo || ''}
            onChange={(e) => updateNavbar({ logo: e.target.value })}
            className="text-gray-900 bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label>CTA Button Text</Label>
          <Input
            value={navbar.ctaText || ''}
            onChange={(e) => updateNavbar({ ctaText: e.target.value })}
            className="text-gray-900 bg-white"
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Navigation Links</h4>
          <div className="space-y-4">
            {navbar.links.map((link, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200 relative group">
                <button
                  onClick={() => removeLink(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent"
                >
                  <Trash2 size={14} />
                </button>

                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={link.label}
                      onChange={(e) => updateLink(index, 'label', e.target.value)}
                      className="h-8 text-sm text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Target Page</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer text-gray-900"
                      value={link.href}
                      onChange={(e) => updateLink(index, 'href', e.target.value)}
                    >
                      <optgroup label="Pages">
                        {pages.map(page => (
                          <option key={page.id} value={page.slug}>{page.title}</option>
                        ))}
                        <option value="/">Home (/)</option>
                      </optgroup>
                      <optgroup label="Custom">
                        <option value="#"># (No Link)</option>
                        {!pages.some(p => p.slug === link.href) && link.href !== '/' && link.href !== '#' && (
                          <option value={link.href}>Current: {link.href}</option>
                        )}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <Button onClick={addLink} variant="outline" size="sm" className="w-full gap-2 border-dashed text-gray-600 bg-transparent hover:bg-gray-50">
              <Plus size={14} /> Add Link
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // --- Footer Editor ---
  const renderFooterEditor = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Brand Name</Label>
          <Input
            value={footer.brandName || ''}
            onChange={(e) => updateFooter({ brandName: e.target.value })}
            className="text-gray-900 bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <textarea
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[80px]"
            value={footer.brandDescription || ''}
            onChange={(e) => updateFooter({ brandDescription: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Copyright Text</Label>
          <Input
            value={footer.copyright || ''}
            onChange={(e) => updateFooter({ copyright: e.target.value })}
            className="text-gray-900 bg-white"
          />
        </div>

        <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded">
          Column editing is currently disabled in simplified mode.
          <br />(Coming soon: Drag & Drop Footer Columns)
        </div>
      </div>
    );
  };


  // Generic handler for top-level properties
  const handleChange = (key, value) => {
    const newContent = { ...selectedSection.content, [key]: value };
    updateSection(selectedSection.id, newContent);
  };




  // --- Feature Grid Editor Logic ---
  const renderFeatureGridFields = () => {
    const features = selectedSection.content.features || [];

    const updateFeature = (index, field, value) => {
      const newFeatures = [...features];
      newFeatures[index] = { ...newFeatures[index], [field]: value };
      updateSection(selectedSection.id, { ...selectedSection.content, features: newFeatures });
    };

    const addFeature = () => {
      const newFeatures = [...features, { icon: 'Star', title: 'New Feature', description: 'Describe this amazing feature.' }];
      updateSection(selectedSection.id, { ...selectedSection.content, features: newFeatures });
    };

    const removeFeature = (index) => {
      if (confirm('Delete this feature?')) {
        const newFeatures = features.filter((_, i) => i !== index);
        updateSection(selectedSection.id, { ...selectedSection.content, features: newFeatures });
      }
    };

    return (
      <div className="space-y-6">
        {features.map((feature, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm relative group hover:border-blue-300 transition-colors">
            {/* Header / Remove */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                Item #{index + 1}
              </span>
              <button
                onClick={() => removeFeature(index)}
                className="bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded p-1 transition-colors shadow-sm"
                title="Remove Feature"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Icon Input */}
              <div className="grid grid-cols-4 gap-2 items-center">
                <Label className="col-span-1 text-xs text-gray-500">Icon</Label>
                <Input
                  value={feature.icon}
                  onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                  className="col-span-3 h-8 text-sm text-gray-900"
                  placeholder="e.g. Shield"
                />
              </div>

              {/* Title Input */}
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Title</Label>
                <Input
                  value={feature.title}
                  onChange={(e) => updateFeature(index, 'title', e.target.value)}
                  className="h-9 font-medium text-gray-900"
                />
              </div>

              {/* Description Input */}
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Description</Label>
                <textarea
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[80px] resize-y placeholder:text-gray-400"
                  value={feature.description}
                  onChange={(e) => updateFeature(index, 'description', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <Button onClick={addFeature} variant="outline" className="w-full border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 gap-2 h-12">
          <Plus size={16} /> Add Feature Card
        </Button>
      </div>
    );
  };

  // --- Render Preview for Confirmation Modal ---
  const renderExtractedDataPreview = () => {
    if (!extractedData?.data) return null;

    const data = extractedData.data;
    const method = extractedData.method;

    if (selectedSection.type === 'COMPARISON_GRAPH') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-3">Found <strong>{data.length}</strong> performance entries:</p>
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-900">
              <tr>
                <th className="text-left p-2 border border-gray-300">Name</th>
                <th className="text-right p-2 border border-gray-300">IOPS</th>
                <th className="text-right p-2 border border-gray-300">Throughput</th>
              </tr>
            </thead>
            <tbody className="text-gray-900">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-2 border border-gray-300">{row.name}</td>
                  <td className="p-2 border border-gray-300 text-right font-mono">{row.iops.toLocaleString()}</td>
                  <td className="p-2 border border-gray-300 text-right font-mono">{row.throughput.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {method === 'csv' && (
            <p className="text-xs text-amber-600 mt-2">⚠️ Parsed using CSV fallback (AI unavailable)</p>
          )}
        </div>
      );
    }

    if (selectedSection.type === 'FEATURE_GRID') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Found <strong>{data.length}</strong> features:</p>
          {data.map((feature, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{feature.icon}</span>
                <strong className="text-sm">{feature.title}</strong>
              </div>
              <p className="text-xs text-gray-600">{feature.description}</p>
            </div>
          ))}
          {method === 'csv' && (
            <p className="text-xs text-amber-600">⚠️ Parsed using CSV fallback (AI unavailable)</p>
          )}
        </div>
      );
    }

    if (selectedSection.type === 'HERO') {
      return (
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">Badge</p>
            <p className="font-mono">{data.badge}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">Title</p>
            <p><strong>{data.title?.line1}</strong> <span className="text-blue-600">{data.title?.highlight}</span></p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">Subtitle</p>
            <p>{data.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs text-gray-500 mb-1">Primary CTA</p>
              <p className="font-medium">{data.primaryCta}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs text-gray-500 mb-1">Secondary CTA</p>
              <p className="font-medium">{data.secondaryCta}</p>
            </div>
          </div>
        </div>
      );
    }

    if (selectedSection.type === 'CUSTOM_HTML') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-2">Mapped content from file:</p>
          <div className="bg-gray-50 rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="text-left p-2 font-medium">Field</th>
                  <th className="text-left p-2 font-medium">Extracted Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(data).map(([key, value]) => (
                  <tr key={key}>
                    <td className="p-2 font-mono text-xs text-gray-500">{key}</td>
                    <td className="p-2 text-gray-900 truncate max-w-xs" title={String(value)}>{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
  };

  const renderFields = () => {
    // Determine what to render based on selection (Section vs Global)
    if (isNavbar) return renderNavbarEditor();
    if (isFooter) return renderFooterEditor();

    const { type, content } = selectedSection;

    // Helper for updating specific style keys
    const handleStyleChange = (key, newStyles) => {
      updateSection(selectedSection.id, {
        ...content,
        styles: { ...(content.styles || {}), [key]: newStyles }
      });
    };

    switch (type) {
      case 'HERO':
        return (
          <div className="space-y-6">


            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Manual Edit</h4>
            </div>

            <div className="space-y-2">
              <Label>Badge Text</Label>
              <Input
                value={content.badge || ''}
                onChange={(e) => handleChange('badge', e.target.value)}
                className="text-gray-900"
              />
              <StyleControls styles={content.styles?.badge} onChange={s => handleStyleChange('badge', s)} />
            </div>
            <div className="space-y-2">
              <Label>Title (Line 1)</Label>
              <Input
                value={content.title?.line1 || ''}
                onChange={(e) => updateSection(selectedSection.id, {
                  ...content,
                  title: { ...content.title, line1: e.target.value }
                })}
                className="text-gray-900"
              />
              <StyleControls styles={content.styles?.titleLine1} onChange={s => handleStyleChange('titleLine1', s)} />
            </div>
            <div className="space-y-2">
              <Label>Title Highlight</Label>
              <Input
                value={content.title?.highlight || ''}
                onChange={(e) => updateSection(selectedSection.id, {
                  ...content,
                  title: { ...content.title, highlight: e.target.value }
                })}
                className="text-gray-900"
              />
              <StyleControls styles={content.styles?.titleHighlight} onChange={s => handleStyleChange('titleHighlight', s)} />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-gray-400"
                value={content.subtitle || ''}
                onChange={(e) => handleChange('subtitle', e.target.value)}
              />
              <StyleControls styles={content.styles?.subtitle} onChange={s => handleStyleChange('subtitle', s)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary CTA</Label>
                <Input
                  value={content.primaryCta || ''}
                  onChange={(e) => handleChange('primaryCta', e.target.value)}
                  className="text-gray-900"
                />
                <StyleControls styles={content.styles?.primaryCta} onChange={s => handleStyleChange('primaryCta', s)} />
              </div>
              <div className="space-y-2">
                <Label>Secondary CTA</Label>
                <Input
                  value={content.secondaryCta || ''}
                  onChange={(e) => handleChange('secondaryCta', e.target.value)}
                  className="text-gray-900"
                />
                <StyleControls styles={content.styles?.secondaryCta} onChange={s => handleStyleChange('secondaryCta', s)} />
              </div>
            </div>
          </div>
        );

      case 'FEATURE_GRID':
        return (
          <div className="space-y-6">


            {/* Global Styles */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-[10px] text-gray-400 font-medium mb-3 uppercase tracking-wide text-center">Card Styles</p>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs">Card Title Style</Label>
                  <StyleControls styles={content.styles?.cardTitle} onChange={s => handleStyleChange('cardTitle', s)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Card Description Style</Label>
                  <StyleControls styles={content.styles?.cardDescription} onChange={s => handleStyleChange('cardDescription', s)} />
                </div>
              </div>
            </div>

            {renderFeatureGridFields()}
          </div>
        );

      case 'COMPARISON_GRAPH':
        return (
          <div className="space-y-6">
            {/* Graph Data Import Area */}
            <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Performance Data</h4>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {(content.data || []).length} Entries
                </span>
              </div>



              {/* Mini Preview of Data */}
              <div className="mt-2 border-t border-gray-200 pt-2 max-h-32 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      <th className="py-1">Name</th>
                      <th className="py-1 text-right">IOPS</th>
                      <th className="py-1 text-right">MB/s</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px] text-gray-700 font-mono">
                    {(content.data || []).map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-100">
                        <td className="py-1 truncate max-w-[80px]" title={row.name}>{row.name}</td>
                        <td className="py-1 text-right">{row.iops.toLocaleString()}</td>
                        <td className="py-1 text-right">{row.throughput.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={content.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="text-gray-900"
              />
              <StyleControls styles={content.styles?.title} onChange={s => handleStyleChange('title', s)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-gray-400"
                value={content.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              <StyleControls styles={content.styles?.description} onChange={s => handleStyleChange('description', s)} />
            </div>
          </div>
        );

      case 'CUSTOM_HTML':
        if (!content.schema || content.schema.length === 0) {
          return <div className="p-4 text-center text-gray-500 italic">No editable fields defined for this section.</div>;
        }

        const handleCustomChange = (key, value) => {
          updateSection(selectedSection.id, {
            ...content,
            content: { ...content.content, [key]: value }
          });
        };

        return (
          <div className="space-y-6">


            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Content Fields</h4>
            </div>

            {content.schema.map((field) => (
              <div key={field.key} className="space-y-2 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <Label>{field.label}</Label>
                  {/* Visual indicator if styles are applied */}
                  {(content.styles?.[field.key] && Object.keys(content.styles[field.key]).length > 0) && (
                    <Settings2 size={12} className="text-blue-500" />
                  )}
                </div>

                {/* Content Input */}
                {(() => {
                  const isImageField = field.type === 'image' ||
                    field.key.toLowerCase().includes('image') ||
                    field.label.toLowerCase().includes('image');

                  if (isImageField) {
                    return (
                      <ImageUploadField
                        value={content.content?.[field.key] || ''}
                        onChange={(val) => handleCustomChange(field.key, val)}
                        placeholder={field.description || "Image URL"}
                      />
                    );
                  }

                  if (field.type === 'textarea') {
                    return (
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-gray-400"
                        value={content.content?.[field.key] || ''}
                        onChange={(e) => handleCustomChange(field.key, e.target.value)}
                        placeholder={field.description}
                      />
                    );
                  }

                  return (
                    <Input
                      value={content.content?.[field.key] || ''}
                      onChange={(e) => handleCustomChange(field.key, e.target.value)}
                      className="text-gray-900"
                      placeholder={field.description}
                    />
                  );
                })()}

                {/* Style Controls for this field */}
                <StyleControls
                  styles={content.styles?.[field.key] || {}}
                  onChange={(newStyles) => handleStyleChange(field.key, newStyles)}
                />
              </div>
            ))}
          </div>
        );

      default:
        return <div className="text-gray-400 italic text-sm p-4 text-center">No editable properties for {type}</div>;
    }
  };

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col h-full shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <h2 className="font-semibold text-sm text-gray-900">Properties</h2>
        </div>
        <p className="text-[10px] text-gray-400 font-mono truncate pl-4">
          ID: {isNavbar ? 'Global Navbar' : isFooter ? 'Global Footer' : selectedSection.id}
        </p>
      </div>

      <div className="p-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
        {renderFields()}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <Button variant="outline" className="w-full text-xs text-gray-500 hover:text-gray-900">
          {(isNavbar || isFooter) ? 'Reset Defaults' : 'Reset Section to Defaults'}
        </Button>
      </div>
    </div>
  );
};


export default PropertyPanel;