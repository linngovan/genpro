import React, { useState, useEffect } from 'react';
import ImageDropzone from './components/ImageDropzone';
import DetailSelector from './components/DetailSelector';
import { UploadedImage, DetailLevel } from './types';
import { generateImagePrompt, generateRefinedImage } from './services/geminiService';
import { IconSparkles, IconCopy, IconCheck, IconDownload, IconExpand, IconClose } from './components/Icons';

const App: React.FC = () => {
  // Main Analysis States
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(DetailLevel.STANDARD);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Test/Refine States
  const [testImage, setTestImage] = useState<UploadedImage | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  // Lightbox State
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Global Paste Handler for the main input (if no image selected yet)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // If we already have a source image, don't auto-paste into source
      // If the user wants to paste into 'Test Image', they should focus there or use the button
      // This simple logic prevents overwriting the main image accidentally
      if (image && !testImage) return; 

      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const src = evt.target?.result as string;
                    if (!image) {
                        setImage({ src, file, mimeType: file.type });
                    }
                };
                reader.readAsDataURL(file);
            }
            break; 
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [image, testImage]);

  const handleImageSelected = (img: UploadedImage) => {
    setImage(img);
    setGeneratedPrompt('');
    setResultImage(null);
  };

  const handleClear = () => {
    setImage(null);
    setGeneratedPrompt('');
    setIsGenerating(false);
    setTestImage(null);
    setResultImage(null);
  };

  const handleGenerate = async () => {
    if (!image) return;

    setIsGenerating(true);
    setGeneratedPrompt('');
    setResultImage(null);
    
    try {
      const result = await generateImagePrompt({
        imageBase64: image.src,
        mimeType: image.mimeType,
        detailLevel: detailLevel
      });
      setGeneratedPrompt(result);
      // Automatically set the test image to the source image for convenience
      setTestImage(image);
    } catch (error) {
      console.error(error);
      setGeneratedPrompt("An error occurred while generating the prompt. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefineImage = async () => {
    if (!testImage || !generatedPrompt) return;

    setIsRefining(true);
    setResultImage(null);

    try {
        const resultBase64 = await generateRefinedImage(testImage.src, testImage.mimeType, generatedPrompt);
        setResultImage(resultBase64);
    } catch (error) {
        console.error(error);
        alert("Failed to refine image. Please try again.");
    } finally {
        setIsRefining(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `refined-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Header */}
      <div className="w-full max-w-5xl mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tight mb-3">
          Prompt Reverse Engineer
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Upload an image, and our AI will generate the perfect text prompt to recreate it.
        </p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Image Input */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface p-6 rounded-3xl border border-slate-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-sm">1</span> Source Image
              </h2>
            </div>
            <ImageDropzone 
              currentImage={image}
              onImageSelected={handleImageSelected}
              onClear={handleClear}
              onExpand={image ? () => setLightboxSrc(image.src) : undefined}
              disabled={isGenerating}
            />
          </div>

          <div className="bg-surface p-6 rounded-3xl border border-slate-700 shadow-xl">
             <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="bg-secondary/20 text-secondary px-2 py-0.5 rounded text-sm">2</span> Settings
              </h2>
            </div>
            <DetailSelector 
              value={detailLevel}
              onChange={setDetailLevel}
              disabled={isGenerating || !image}
            />
            
            <button
              onClick={handleGenerate}
              disabled={!image || isGenerating}
              className={`
                w-full mt-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300
                ${!image 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : isGenerating
                    ? 'bg-primary/50 text-white cursor-wait'
                    : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transform hover:-translate-y-0.5'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Image...
                </>
              ) : (
                <>
                  <IconSparkles className="w-6 h-6" />
                  Generate Prompt
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output & Test */}
        <div className="flex flex-col gap-6">
            {/* Generated Prompt Section */}
          <div className={`
             bg-surface rounded-3xl border border-slate-700 shadow-xl flex flex-col overflow-hidden transition-all duration-500
             ${generatedPrompt || isGenerating ? 'opacity-100 translate-x-0' : 'opacity-50 lg:opacity-100'}
          `}>
             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-sm">3</span> Result
                </h2>
                
                <button 
                  onClick={handleCopy}
                  disabled={!generatedPrompt}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${!generatedPrompt 
                      ? 'text-slate-600 cursor-not-allowed' 
                      : copied 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }
                  `}
                >
                  {copied ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
             </div>

             <div className="flex-1 p-6 relative flex flex-col">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 animate-pulse-slow">
                     <IconSparkles className="w-16 h-16 mb-4 text-primary/50" />
                     <p className="text-lg">Reading pixels...</p>
                     <p className="text-sm text-slate-600 mt-2">Identifying artistic styles & lighting</p>
                  </div>
                ) : generatedPrompt ? (
                  <textarea 
                    value={generatedPrompt}
                    onChange={(e) => setGeneratedPrompt(e.target.value)}
                    className="w-full h-48 bg-transparent resize-y focus:outline-none text-lg text-slate-200 leading-relaxed custom-scrollbar p-2 rounded-lg focus:bg-black/20 transition-colors border border-transparent focus:border-slate-700"
                    placeholder="Generated prompt will appear here..."
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-600">
                    <p>The magic happens here.</p>
                  </div>
                )}
             </div>
          </div>

          {/* Test/Refine Prompt Section - Only Visible when prompt is generated */}
          {generatedPrompt && !isGenerating && (
             <div className="bg-surface rounded-3xl border border-slate-700 shadow-xl overflow-hidden animate-fade-in-up">
                 <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-sm">4</span> Simulation Lab
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Refine the image using the prompt above.</p>
                 </div>

                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Input Image for Refine */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-400">Target Image</label>
                            {image && image !== testImage && (
                                <button 
                                    onClick={() => setTestImage(image)}
                                    className="text-xs text-primary hover:text-primary/80 hover:underline"
                                >
                                    Use Source Image
                                </button>
                            )}
                        </div>
                        <ImageDropzone 
                            currentImage={testImage}
                            onImageSelected={setTestImage}
                            onClear={() => { setTestImage(null); setResultImage(null); }}
                            onExpand={testImage ? () => setLightboxSrc(testImage.src) : undefined}
                            disabled={isRefining}
                            className="h-48"
                        />
                    </div>

                    {/* Output Image */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-400">Refined Result</label>
                        <div className="relative w-full h-48 rounded-2xl border border-slate-700 bg-black/50 flex items-center justify-center overflow-hidden group">
                            {isRefining ? (
                                <div className="flex flex-col items-center text-purple-400">
                                    <svg className="animate-spin h-8 w-8 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-xs">Generating...</span>
                                </div>
                            ) : resultImage ? (
                                <>
                                    <img 
                                        src={resultImage} 
                                        alt="Refined Result" 
                                        className="max-w-full max-h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 backdrop-blur-sm">
                                        <button 
                                            onClick={() => setLightboxSrc(resultImage)}
                                            className="flex items-center justify-center p-2.5 bg-white text-slate-900 rounded-lg hover:bg-gray-100 transition-all shadow-lg hover:scale-105"
                                            title="Expand Image"
                                        >
                                            <IconExpand className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={handleDownload}
                                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg font-bold hover:bg-gray-100 transition-all shadow-lg hover:scale-105"
                                        >
                                            <IconDownload className="w-5 h-5" />
                                            <span>Download</span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-600 text-sm text-center px-4">
                                    Result will appear here
                                </div>
                            )}
                        </div>
                    </div>
                 </div>

                 <div className="p-6 pt-0">
                    <button
                        onClick={handleRefineImage}
                        disabled={!testImage || !generatedPrompt || isRefining}
                        className={`
                            w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                            ${!testImage 
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                : isRefining
                                    ? 'bg-purple-600/50 text-white cursor-wait'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg hover:shadow-purple-500/25'
                            }
                        `}
                    >
                        {isRefining ? 'Refining...' : 'Refine Image with Prompt'}
                    </button>
                 </div>
             </div>
          )}
        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setLightboxSrc(null)}
        >
            <button 
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                onClick={() => setLightboxSrc(null)}
            >
                <IconClose className="w-8 h-8" />
            </button>
            <img 
                src={lightboxSrc} 
                alt="Fullscreen" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
            />
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-12 text-slate-600 text-sm">
        <p>Powered by Google Gemini 2.5 Flash</p>
      </div>

    </div>
  );
};

export default App;