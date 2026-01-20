import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Link } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

const ImageUploadField = ({ value, onChange, placeholder }) => {
    const fileInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        processFile(file);
        e.target.value = ''; // Reset
    };

    const processFile = (file) => {
        if (file.size > 2 * 1024 * 1024) {
            alert("Image is too large (max 2MB)");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            onChange(e.target.result); // Pass Base64 string
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                processFile(file);
                return;
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        onPaste={handlePaste}
                        placeholder={placeholder || "https://... or paste image"}
                        className="pl-8 text-gray-900"
                    />
                    <Link size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload Image"
                    className="px-3"
                >
                    <Upload size={16} />
                </Button>
            </div>

            {/* Preview Area / Drop Zone */}
            <div
                className={`
          relative rounded-lg border-2 border-dashed transition-all overflow-hidden
          ${value ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-blue-400 bg-white'}
          ${isDragOver ? 'border-blue-500 bg-blue-50' : ''}
        `}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
            >
                {value ? (
                    <div className="relative group aspect-video flex items-center justify-center bg-[#111827]">
                        <img
                            src={value}
                            alt="Preview"
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        {/* Remove button overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onChange('')}
                                className="h-8 w-8 p-0 rounded-full"
                            >
                                <X size={14} />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="h-20 flex flex-col items-center justify-center text-gray-400 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon size={20} className="mb-1 opacity-50" />
                        <span className="text-xs">Drop or paste image</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUploadField;
