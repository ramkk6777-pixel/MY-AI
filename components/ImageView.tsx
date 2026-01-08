
import React, { useState } from 'react';
import { generateImage } from '../services/gemini';
import { GeneratedImage } from '../types';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const imageUrl = await generateImage(prompt);
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        timestamp: new Date(),
      };
      setImages(prev => [newImage, ...prev]);
      setPrompt('');
    } catch (error) {
      console.error("Image generation error:", error);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-8 max-w-7xl mx-auto w-full overflow-y-auto">
      <div className="bg-slate-800/50 p-6 md:p-10 rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i>
          Create with Imagination
        </h2>
        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe an image you'd like to see... e.g., 'A cyberpunk garden at night with bioluminescent plants'"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] transition-all resize-none shadow-inner"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className={`md:w-48 rounded-2xl font-bold transition-all shadow-xl flex items-center justify-center gap-3 py-4 md:py-0 ${
              !prompt.trim() || isGenerating
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95'
            }`}
          >
            {isGenerating ? (
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            ) : (
              <i className="fa-solid fa-sparkles"></i>
            )}
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {images.map((img) => (
          <div key={img.id} className="group relative bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
            <img 
              src={img.url} 
              alt={img.prompt}
              className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="p-5 bg-gradient-to-t from-slate-900 to-transparent">
              <p className="text-sm line-clamp-2 font-medium text-slate-200">{img.prompt}</p>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">{img.timestamp.toLocaleDateString()}</p>
            </div>
            <a 
              href={img.url} 
              download={`gemini-${img.id}.png`}
              className="absolute top-4 right-4 w-10 h-10 bg-slate-900/80 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600 shadow-xl"
            >
              <i className="fa-solid fa-download"></i>
            </a>
          </div>
        ))}

        {images.length === 0 && !isGenerating && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 opacity-40">
            <i className="fa-solid fa-images text-8xl mb-4"></i>
            <p className="text-xl font-medium">Your creative gallery will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageView;
