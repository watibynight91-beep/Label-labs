import React, { useState, Suspense } from 'react';
import type { MockupView, DimensionsData, LabelData, PackagingData } from '../types';
import DownloadButton from './DownloadButton';
import ThreeDeePreview from './ThreeDeePreview';

interface PreviewAreaProps {
    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
    generatedLabel: string | null;
    generatedMockup: {
        front: string | null;
        back: string | null;
    };
    labelVariations: string[];
    onSelectVariation: (selectedLabel: string) => void;
    onRefine: (prompt: string) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    mockupView: MockupView;
    dimensionsData: DimensionsData;
    labelData: LabelData;
    packagingData: PackagingData;
}

const Spinner = () => (
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
);

const Placeholder = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-lg p-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-24 w-24 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.692c0 .356.186.683.475.865l4.283 2.624M9.75 3.104a2.25 2.25 0 014.5 0v5.692a2.25 2.25 0 01-1.42 2.1l-4.283 2.624a2.25 2.25 0 01-3.08-2.1V5.204a2.25 2.25 0 013.08-2.1z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 10.155l-4.283-2.624M14.25 10.155a2.25 2.25 0 01-1.42-2.1V5.204a2.25 2.25 0 013.08-2.1l4.283 2.624a2.25 2.25 0 011.42 2.1v5.692a2.25 2.25 0 01-3.08 2.1l-4.283-2.624a2.25 2.25 0 01-1.42-2.1z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-slate-400">Design Preview</h3>
        <p className="mt-1 text-sm">Your generated labels and mockups will appear here.</p>
    </div>
);

const UndoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
);

const RedoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
    </svg>
);

const PlacementGuide: React.FC<{ placement: PackagingData['placement'] }> = ({ placement }) => {
    const guideStyle: React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '50%', 
        height: '70%',
        border: '2px dashed rgba(255, 255, 255, 0.7)',
        transform: `
            translateX(-50%) 
            translateY(-50%) 
            translateX(${placement.offsetX}%) 
            translateY(${placement.offsetY}%) 
            rotate(${placement.rotation}deg)
        `,
        transition: 'transform 0.1s ease-out',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: 10,
    };
    return <div style={guideStyle}></div>;
};


const PreviewArea: React.FC<PreviewAreaProps> = ({ 
    isLoading, loadingMessage, error, generatedLabel, generatedMockup, 
    onRefine, labelVariations, onSelectVariation,
    onUndo, onRedo, canUndo, canRedo, mockupView,
    dimensionsData, labelData, packagingData
}) => {
    const [refinementPrompt, setRefinementPrompt] = useState('');

    const handleRefineSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (refinementPrompt.trim()) {
            onRefine(refinementPrompt);
            setRefinementPrompt('');
        }
    };
    
    const { front: frontMockup, back: backMockup } = generatedMockup;
    const hasAnyMockup = frontMockup || backMockup;

    // Condition to show refinement UI. Only for single views.
    const showControls = !isLoading && labelVariations.length === 0 && (
      (mockupView === 'front' && frontMockup) ||
      (mockupView === 'back' && backMockup) ||
      (!hasAnyMockup && generatedLabel)
    );

    const showDownload = !hasAnyMockup && generatedLabel && !isLoading && labelVariations.length === 0;

    const showPlacementGuide = !isLoading && (
      (mockupView === 'front' && frontMockup) ||
      (mockupView === 'back' && backMockup)
    );

    // This is the new condition to determine if we should render the 3D preview.
    const show3DScene = hasAnyMockup && mockupView !== 'front-back';

    return (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700 h-full flex flex-col p-4">
            <div className="flex-grow bg-black/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 space-y-4">
                        <Spinner />
                        <p className="text-lg font-medium text-slate-200">{loadingMessage}</p>
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 bg-red-900/50 flex flex-col items-center justify-center z-10 p-8 text-center">
                        <h3 className="text-lg font-bold text-red-300">An Error Occurred</h3>
                        <p className="text-sm text-red-400 mt-2">{error}</p>
                    </div>
                )}

                {showPlacementGuide && !show3DScene && <PlacementGuide placement={packagingData.placement} />}
                
                {labelVariations.length > 0 && !isLoading && (
                    <div className="w-full h-full overflow-y-auto p-4">
                        <h3 className="text-lg font-semibold text-center mb-4 text-slate-200">Choose a Variation</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {labelVariations.map((variation, index) => (
                                <button key={index} onClick={() => onSelectVariation(variation)} className="bg-slate-700/50 rounded-lg overflow-hidden transition-transform duration-200 hover:scale-105 hover:ring-2 hover:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <img src={`data:image/png;base64,${variation}`} alt={`Variation ${index + 1}`} className="w-full h-full object-cover aspect-square" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {!isLoading && labelVariations.length === 0 && (() => {
                    if (show3DScene) {
                        return (
                            <Suspense fallback={<Spinner />}>
                                <ThreeDeePreview />
                            </Suspense>
                        );
                    }

                    if (mockupView === 'front-back') {
                        if (frontMockup && backMockup) {
                            return (
                                <div className="flex h-full w-full gap-4 items-center justify-center p-4">
                                    <img src={`data:image/png;base64,${frontMockup}`} alt="Front mockup" className="object-contain max-h-full max-w-[50%]" />
                                    <img src={`data:image/png;base64,${backMockup}`} alt="Back mockup" className="object-contain max-h-full max-w-[50%]" />
                                </div>
                            );
                        }
                        return <Placeholder />;
                    }

                    const singleImageToDisplay = generatedLabel;

                    if (singleImageToDisplay) {
                        return <img src={`data:image/png;base64,${singleImageToDisplay}`} alt="Generated design" className="object-contain max-h-full max-w-full" />;
                    }

                    return <Placeholder />;
                })()}

            </div>
            {(showControls || showDownload) && (
                <div className="flex-shrink-0 pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="refine" className="block text-sm font-medium text-slate-300">{showControls ? 'Refine Design' : ' '}</label>
                        <div className="flex items-center space-x-2">
                            {showDownload && generatedLabel && (
                                <DownloadButton
                                    labelImageBase64={generatedLabel}
                                    dimensions={dimensionsData}
                                    labelInfo={labelData}
                                />
                            )}
                            {showControls && (
                                <>
                                <button onClick={onUndo} disabled={!canUndo || isLoading} title="Undo" aria-label="Undo" className="p-2 rounded-md bg-slate-700/50 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    <UndoIcon />
                                </button>
                                <button onClick={onRedo} disabled={!canRedo || isLoading} title="Redo" aria-label="Redo" className="p-2 rounded-md bg-slate-700/50 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    <RedoIcon />
                                </button>
                                </>
                            )}
                        </div>
                    </div>
                    {showControls && (
                        <form onSubmit={handleRefineSubmit} className="flex space-x-2">
                        <input 
                                id="refine"
                                type="text"
                                value={refinementPrompt}
                                onChange={(e) => setRefinementPrompt(e.target.value)}
                                placeholder="e.g., Make the background color soft peach"
                                disabled={isLoading}
                                className="flex-grow bg-slate-700/50 p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
                        />
                        <button type="submit" disabled={isLoading || !refinementPrompt.trim()} className="bg-indigo-600 text-white font-semibold py-3 px-5 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                            Iterate
                        </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default PreviewArea;