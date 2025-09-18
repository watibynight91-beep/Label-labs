import React, { useState, useRef } from 'react';
import type { LabelData, DimensionsData, PackagingData, MockupView, TriggeredAction } from '../types';
import { generateTextSuggestions, generatePackagingSuggestions } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import MagicWandIcon from './icons/MagicWandIcon';
import SuggestionWandIcon from './icons/SuggestionWandIcon';
import SuggestionPopover from './common/SuggestionPopover';

interface ControlPanelProps {
  labelData: LabelData;
  setLabelData: React.Dispatch<React.SetStateAction<LabelData>>;
  dimensionsData: DimensionsData;
  setDimensionsData: React.Dispatch<React.SetStateAction<DimensionsData>>;
  packagingData: PackagingData;
  setPackagingData: React.Dispatch<React.SetStateAction<PackagingData>>;
  onLogoChange: (file: File | null) => void;
  onAnalyzeImage: (file: File) => void;
  onGenerateLabel: () => void;
  onGenerateVariations: () => void;
  onGenerateMockup: () => void;
  isLabelGenerated: boolean;
  isLoading: boolean;
  triggeredAction: TriggeredAction;
  setTriggeredAction: React.Dispatch<React.SetStateAction<TriggeredAction>>;
  mockupView: MockupView;
  setMockupView: React.Dispatch<React.SetStateAction<MockupView>>;
}


const presetOptions: { value: PackagingData['preset']; label: string }[] = [
    { value: 'White Plastic Shampoo Bottle', label: 'White Shampoo Bottle' },
    { value: 'White Plastic Pill/Supplement Bottle', label: 'Pill/Supplement Bottle' },
    { value: 'Amber Glass Dropper Bottle', label: 'Amber Glass Dropper Bottle' },
    { value: 'Clear Glass Jar with Lid', label: 'Clear Glass Jar' },
    { value: 'Frosted Plastic Tube', label: 'Frosted Plastic Tube' },
    { value: 'Glossy Stand-up Pouch', label: 'Glossy Stand-up Pouch' },
    { value: 'Matte Cardboard Box', label: 'Matte Cardboard Box' },
];



const ControlPanel: React.FC<ControlPanelProps> = ({
  labelData, setLabelData,
  dimensionsData, setDimensionsData,
  packagingData, setPackagingData,
  onLogoChange, onAnalyzeImage, onGenerateLabel, onGenerateVariations, onGenerateMockup,
  isLabelGenerated, isLoading, triggeredAction, setTriggeredAction,
  mockupView, setMockupView
}) => {
  const [activeTab, setActiveTab] = useState<'label' | 'packaging'>('label');
  const [labelTab, setLabelTab] = useState<'text' | 'image'>('text');

  const [suggestions, setSuggestions] = useState<{ field: keyof LabelData; list: string[] } | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [suggestionLoadingField, setSuggestionLoadingField] = useState<string | null>(null);

  const productNameRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const aestheticRef = useRef<HTMLDivElement>(null);
  const colorPaletteRef = useRef<HTMLDivElement>(null);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLabelData({ ...labelData, [e.target.name]: e.target.value });
  };
  
  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDimensionsData({ ...dimensionsData, [e.target.name]: e.target.value });
  };

  const handlePackagingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPackagingData({ ...packagingData, [e.target.name]: e.target.value });
  };

  const handlePlacementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPackagingData(p => ({
        ...p,
        placement: {
            ...p.placement,
            [e.target.name]: Number(e.target.value)
        }
    }));
  };
  
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLogoChange(e.target.files[0]);
    } else {
      onLogoChange(null);
    }
  };

  const handleAnalyzeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        onAnalyzeImage(e.target.files[0]);
    }
  };
  
  const handleGetSuggestions = async (field: 'productName' | 'tagline' | 'aesthetic' | 'colorPalette') => {
    if (isLoading || suggestionLoadingField) return;
    setSuggestionLoadingField(field);
    setSuggestionError(null);
    setSuggestions({ field, list: [] });
    try {
        const result = await generateTextSuggestions(field, labelData);
        setSuggestions({ field, list: result });
    } catch (e) {
        setSuggestionError(e instanceof Error ? e.message : 'Failed to get suggestions.');
        setSuggestions(null);
    } finally {
        setSuggestionLoadingField(null);
    }
  };

  const handleGetPackagingSuggestions = async () => {
    if (isLoading || suggestionLoadingField) return;
    setSuggestionLoadingField('packaging');
    setSuggestionError(null);
    try {
        const result = await generatePackagingSuggestions(labelData);
        setPackagingData(prev => ({
            ...prev,
            ...result,
        }));
    } catch (e) {
        setSuggestionError(e instanceof Error ? e.message : 'Failed to suggest packaging.');
    } finally {
        setSuggestionLoadingField(null);
    }
  };
  
  const handleSelectSuggestion = (field: keyof LabelData, value: string) => {
    setLabelData(prev => ({ ...prev, [field]: value }));
    setSuggestions(null);
  };

  const packagingInputClass = `w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300`;
  const packagingLoadingClass = `ring-2 ring-indigo-500/70 ring-offset-2 ring-offset-slate-800 animate-pulse`;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 h-full overflow-y-auto">
      <div className="flex border-b border-slate-700 mb-6">
        <button onClick={() => setActiveTab('label')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'label' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'}`}>Label Design</button>
        <button onClick={() => setActiveTab('packaging')} disabled={!isLabelGenerated} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'packaging' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400'} disabled:text-slate-600 disabled:cursor-not-allowed`}>Packaging Mockup</button>
      </div>

      <div className={`${activeTab === 'label' ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-2 gap-2 p-1 mb-6 rounded-lg bg-slate-700/50 border border-slate-600">
          <button type="button" onClick={() => setLabelTab('text')} className={`px-2 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 ${labelTab === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
            From Text
          </button>
          <button type="button" onClick={() => setLabelTab('image')} className={`px-2 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 ${labelTab === 'image' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
            From Image
          </button>
        </div>
        
        <div className={`${labelTab === 'text' ? 'block' : 'hidden'}`}>
            <form onSubmit={(e) => { e.preventDefault(); onGenerateLabel(); }} className="space-y-6">
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-white mb-2">1. Label Content</legend>
                
                <div className="space-y-4 border-l-2 border-slate-700 pl-4">
                  <h3 className="text-md font-medium text-slate-300">Front Panel</h3>
                  <input name="brandName" value={labelData.brandName} onChange={handleLabelChange} placeholder="Brand Name" className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                  
                  <div className="relative" ref={productNameRef}>
                      <div className="flex items-center">
                          <input name="productName" value={labelData.productName} onChange={handleLabelChange} placeholder="Product Name" className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                          <button type="button" onClick={() => handleGetSuggestions('productName')} className="group absolute right-1.5 p-1 rounded-full hover:bg-slate-700 disabled:cursor-not-allowed" disabled={isLoading || !!suggestionLoadingField}>
                              <SuggestionWandIcon isLoading={suggestionLoadingField === 'productName'} />
                          </button>
                      </div>
                      {suggestions?.field === 'productName' && (
                          <SuggestionPopover suggestions={suggestions.list} onSelect={(value) => handleSelectSuggestion('productName', value)} onClose={() => setSuggestions(null)} targetRef={productNameRef} />
                      )}
                  </div>
                  
                  <div className="relative" ref={taglineRef}>
                      <div className="flex items-center">
                          <input name="tagline" value={labelData.tagline} onChange={handleLabelChange} placeholder="Tagline" className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                          <button type="button" onClick={() => handleGetSuggestions('tagline')} className="group absolute right-1.5 p-1 rounded-full hover:bg-slate-700 disabled:cursor-not-allowed" disabled={isLoading || !!suggestionLoadingField}>
                              <SuggestionWandIcon isLoading={suggestionLoadingField === 'tagline'} />
                          </button>
                      </div>
                      {suggestions?.field === 'tagline' && (
                          <SuggestionPopover suggestions={suggestions.list} onSelect={(value) => handleSelectSuggestion('tagline', value)} onClose={() => setSuggestions(null)} targetRef={taglineRef} />
                      )}
                  </div>
                  
                  <input name="weight" value={labelData.weight} onChange={handleLabelChange} placeholder="Net Weight (e.g., 240ml)" className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>

                <div className="space-y-4 border-l-2 border-slate-700 pl-4 pt-4">
                  <h3 className="text-md font-medium text-slate-300">Side & Back Panels</h3>
                  <textarea name="ingredients" value={labelData.ingredients} onChange={handleLabelChange} placeholder="Key Ingredients (e.g., Aloe Vera, Vitamin E)" rows={3} className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                  <textarea name="directions" value={labelData.directions} onChange={handleLabelChange} placeholder="Directions for use" rows={3} className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                  <textarea name="caution" value={labelData.caution} onChange={handleLabelChange} placeholder="Cautionary notes" rows={2} className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                  <input name="companyInfo" value={labelData.companyInfo} onChange={handleLabelChange} placeholder="Company Info (Address, Website)" className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>
                
                <div className="pt-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Brand Logo (Optional)</label>
                    <input type="file" accept="image/png, image/jpeg" onChange={handleLogoFileChange} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600" />
                </div>
            </fieldset>
            
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-white mb-2">2. Style & Dimensions</legend>
                 <div className="relative" ref={aestheticRef}>
                    <div className="flex items-center">
                        <input name="aesthetic" value={labelData.aesthetic} onChange={handleLabelChange} placeholder="Aesthetic (e.g., minimalist, elegant)" className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                        <button type="button" onClick={() => handleGetSuggestions('aesthetic')} className="group absolute right-1.5 p-1 rounded-full hover:bg-slate-700 disabled:cursor-not-allowed" disabled={isLoading || !!suggestionLoadingField}>
                            <SuggestionWandIcon isLoading={suggestionLoadingField === 'aesthetic'} />
                        </button>
                    </div>
                    {suggestions?.field === 'aesthetic' && (
                        <SuggestionPopover suggestions={suggestions.list} onSelect={(value) => handleSelectSuggestion('aesthetic', value)} onClose={() => setSuggestions(null)} targetRef={aestheticRef} />
                    )}
                </div>
                 <div className="relative" ref={colorPaletteRef}>
                    <div className="flex items-center">
                        <input name="colorPalette" value={labelData.colorPalette} onChange={handleLabelChange} placeholder="Color Palette (e.g., pastel, earthy tones)" className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                        <button type="button" onClick={() => handleGetSuggestions('colorPalette')} className="group absolute right-1.5 p-1 rounded-full hover:bg-slate-700 disabled:cursor-not-allowed" disabled={isLoading || !!suggestionLoadingField}>
                            <SuggestionWandIcon isLoading={suggestionLoadingField === 'colorPalette'} />
                        </button>
                    </div>
                    {suggestions?.field === 'colorPalette' && (
                        <SuggestionPopover suggestions={suggestions.list} onSelect={(value) => handleSelectSuggestion('colorPalette', value)} onClose={() => setSuggestions(null)} targetRef={colorPaletteRef} />
                    )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                    <label htmlFor="shape" className="block text-sm font-medium text-slate-300 mb-1">Shape</label>
                    <select name="shape" id="shape" value={dimensionsData.shape} onChange={handleDimensionChange} className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                    <option value="rectangular">Rectangular</option>
                    <option value="square">Square</option>
                    <option value="circular">Circular</option>
                    <option value="oval">Oval</option>
                    </select>
                </div>
                <div className="col-span-1">
                    <label htmlFor="width" className="block text-sm font-medium text-slate-300 mb-1">Width (in)</label>
                    <input type="number" name="width" id="width" value={dimensionsData.width} onChange={handleDimensionChange} className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>
                <div className="col-span-1">
                    <label htmlFor="height" className="block text-sm font-medium text-slate-300 mb-1">Height (in)</label>
                    <input type="number" name="height" id="height" value={dimensionsData.height} onChange={handleDimensionChange} className="w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>
                </div>
            </fieldset>
            
            <div className="flex items-center space-x-3 pt-2">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    <MagicWandIcon />
                    {isLoading && triggeredAction === 'single' ? 'Designing...' : 'Generate Label'}
                </button>
                <button
                    type="button"
                    onClick={onGenerateVariations}
                    disabled={isLoading}
                    title="Generate 3 variations"
                    aria-label="Generate 3 variations"
                    className="shrink-0 bg-slate-700 text-white font-bold p-3 rounded-lg hover:bg-slate-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center border border-slate-500"
                >
                    {isLoading && triggeredAction === 'variations' ? <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-slate-100"></div> : <SparklesIcon />}
                </button>
            </div>
            </form>
        </div>

        <div className={`${labelTab === 'image' ? 'block' : 'hidden'}`}>
            <div className="space-y-4 text-center p-4 border border-dashed border-slate-600 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-slate-200">Generate a Similar Design</h3>
                <p className="text-sm text-slate-400">Upload an existing label image and our AI will analyze it to create a new, inspired design.</p>
                <input
                    type="file"
                    id="analyze-image-input"
                    accept="image/png, image/jpeg"
                    onChange={handleAnalyzeFileChange}
                    className="hidden"
                    disabled={isLoading}
                />
                <label
                    htmlFor="analyze-image-input"
                    className={`w-full max-w-xs mx-auto text-center font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
                        isLoading
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                >
                {isLoading && triggeredAction === 'analyze' ? (
                    <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                    Analyzing...
                    </>
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Image
                    </>
                )}
                </label>
            </div>
        </div>
      </div>

       <div className={`${activeTab === 'packaging' ? 'block' : 'hidden'}`}>
        <form onSubmit={(e) => { e.preventDefault(); onGenerateMockup(); }} className="space-y-6">
           <fieldset className="space-y-4">
             <div className="flex justify-between items-center mb-2">
                <legend className="text-lg font-semibold text-white">3. Packaging Details</legend>
                <button
                    type="button"
                    onClick={handleGetPackagingSuggestions}
                    disabled={isLoading || !!suggestionLoadingField}
                    className="flex items-center space-x-1.5 text-sm font-semibold text-indigo-300 hover:text-indigo-200 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                >
                    <SuggestionWandIcon isLoading={suggestionLoadingField === 'packaging'} />
                    <span>AI Suggest</span>
                </button>
             </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">View</label>
              <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-slate-700/50 border border-slate-600">
                {(['front', 'back', 'front-back'] as const).map(view => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setMockupView(view)}
                    className={`px-2 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 ${mockupView === view ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                  >
                    {view === 'front-back' ? 'Front & Back' : view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="preset" className="block text-sm font-medium text-slate-300 mb-1">Packaging Preset</label>
                    <select id="preset" name="preset" value={packagingData.preset} onChange={handlePackagingChange} className={`${packagingInputClass} ${suggestionLoadingField === 'packaging' ? packagingLoadingClass : ''}`}>
                        {presetOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div className="self-end">
                    <label htmlFor="finish" className="block text-sm font-medium text-slate-300 mb-1">Finish</label>
                    <input name="finish" id="finish" value={packagingData.finish} onChange={handlePackagingChange} placeholder="e.g., glossy, matte" className={`${packagingInputClass} ${suggestionLoadingField === 'packaging' ? packagingLoadingClass : ''}`} />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="p-height" className="block text-sm font-medium text-slate-300 mb-1">Height (in)</label>
                  <input type="number" id="p-height" name="height" value={packagingData.height} onChange={handlePackagingChange} className={`${packagingInputClass} ${suggestionLoadingField === 'packaging' ? packagingLoadingClass : ''}`} />
                </div>
                <div>
                  <label htmlFor="p-diameter" className="block text-sm font-medium text-slate-300 mb-1">Diameter (in)</label>
                  <input type="number" id="p-diameter" name="diameter" value={packagingData.diameter} onChange={handlePackagingChange} className={`${packagingInputClass} ${suggestionLoadingField === 'packaging' ? packagingLoadingClass : ''}`} />
                </div>
            </div>
          </fieldset>

           <fieldset className="space-y-4">
             <legend className="text-lg font-semibold text-white mb-2">4. Label Placement</legend>
             <div>
                <label htmlFor="rotation" className="flex justify-between text-sm font-medium text-slate-300 mb-1">
                    <span>Rotation</span>
                    <span className="font-mono text-indigo-300">{packagingData.placement.rotation}°</span>
                </label>
                <input 
                    type="range" 
                    id="rotation"
                    name="rotation" 
                    min="-45" 
                    max="45" 
                    step="1"
                    value={packagingData.placement.rotation} 
                    onChange={handlePlacementChange} 
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
             </div>
             <div>
                <label htmlFor="offsetX" className="flex justify-between text-sm font-medium text-slate-300 mb-1">
                    <span>Horizontal Offset (X)</span>
                    <span className="font-mono text-indigo-300">{packagingData.placement.offsetX}%</span>
                </label>
                <input 
                    type="range" 
                    id="offsetX"
                    name="offsetX" 
                    min="-50" 
                    max="50" 
                    step="1"
                    value={packagingData.placement.offsetX} 
                    onChange={handlePlacementChange} 
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
             </div>
             <div>
                <label htmlFor="offsetY" className="flex justify-between text-sm font-medium text-slate-300 mb-1">
                    <span>Vertical Offset (Y)</span>
                    <span className="font-mono text-indigo-300">{packagingData.placement.offsetY}%</span>
                </label>
                <input 
                    type="range" 
                    id="offsetY"
                    name="offsetY" 
                    min="-50" 
                    max="50" 
                    step="1"
                    value={packagingData.placement.offsetY} 
                    onChange={handlePlacementChange} 
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
             </div>
          </fieldset>

          <button type="submit" disabled={isLoading} className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center">
            {isLoading && triggeredAction === 'mockup' ? 'Visualizing...' : 'Generate Mockup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ControlPanel;