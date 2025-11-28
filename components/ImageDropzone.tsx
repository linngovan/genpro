import React, { useCallback, useState, useEffect } from 'react';
import { IconUpload, IconImage, IconTrash, IconExpand } from './Icons';
import { UploadedImage } from '../types';

interface ImageDropzoneProps {
  onImageSelected: (image: UploadedImage) => void;
  onClear: () => void;
  onExpand?: () => void;
  currentImage: UploadedImage | null;
  disabled: boolean;
  className?: string; // Allow custom classes
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ 
  onImageSelected, 
  onClear, 
  onExpand,
  currentImage, 
  disabled,
  className = "h-64 md:h-96" // Default height if not provided
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      onImageSelected({ src, file, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  if (currentImage) {
    return (
      <div 
        className={`relative group w-full ${className} rounded-2xl overflow-hidden border border-slate-700 bg-black/50 flex items-center justify-center shadow-lg transition-all`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <img 
          src={currentImage.src} 
          alt="Uploaded" 
          className="max-w-full max-h-full object-contain"
        />
        
        {/* Overlay controls */}
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 flex items-center justify-center gap-3 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
           {onExpand && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onExpand(); }}
                 disabled={disabled}
                 className="flex items-center justify-center p-2.5 bg-slate-500/20 hover:bg-slate-500/40 text-white rounded-lg transition-colors border border-slate-500/50"
                 title="Expand Image"
               >
                 <IconExpand className="w-5 h-5" />
               </button>
           )}
           <button 
             onClick={onClear}
             disabled={disabled}
             className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg transition-colors border border-red-500/50"
           >
             <IconTrash className="w-5 h-5" />
             <span>Remove</span>
           </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-full ${className} rounded-2xl border-2 border-dashed transition-all duration-300
        flex flex-col items-center justify-center gap-4 cursor-pointer relative overflow-hidden
        ${isDragging 
          ? 'border-primary bg-primary/10 scale-[1.01]' 
          : 'border-slate-700 bg-surface/50 hover:bg-surface hover:border-slate-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileInput} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        disabled={disabled}
      />
      
      <div className={`p-3 rounded-full ${isDragging ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-400'}`}>
        {isDragging ? <IconImage className="w-8 h-8" /> : <IconUpload className="w-8 h-8" />}
      </div>
      
      <div className="text-center px-4">
        <p className="font-semibold text-slate-200">
          {isDragging ? 'Drop it here!' : 'Click or Drop Image'}
        </p>
      </div>
    </div>
  );
};

export default ImageDropzone;