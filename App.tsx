
import React, { useState, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import PreviewArea from './components/PreviewArea';
import { generateLabel, generateMockup, refineImage, generateLabelVariations, analyzeAndGenerateFromImage } from './services/geminiService';
import type { LabelData, DimensionsData, PackagingData, GenerationStep, MockupView, TriggeredAction } from './types';
import { useHistoryState } from './hooks/useHistoryState';

interface DesignState {
    generatedLabel: string | null;
    generatedMockup: {
        front: string | null;
        back: string | null;
    };
}

const App: React.FC = () => {
    const [labelData, setLabelData] = useState<LabelData>({
        productName: 'Organic Hair Shampoo',
        brandName: 'SOUL ESSENCE HEALTH',
        tagline: 'Nourish & Revitalize',
        ingredients: 'Purple Onion, Clove, Garlic, Moringa, Vitamin E, Coconut Oil, Almond Oil',
        directions: 'Massage a generous amount of shampoo into wet hair and scalp. Leave for 5 minutes before rinsing thoroughly.',
        caution: 'For external use only. Avoid contact with eyes.',
        companyInfo: '123 Anywhere ST., Any City, ST 12345 | www.soulhealthessence.com',
        weight: '240ml',
        aesthetic: 'Natural, botanical illustration, clean',
        colorPalette: 'Teal, white, with floral accents',
    });

    const [dimensionsData, setDimensionsData] = useState<DimensionsData>({
        shape: 'rectangular',
        width: 8,
        height: 3.5,
    });

    const [packagingData, setPackagingData] = useState<PackagingData>({
        preset: 'White Plastic Shampoo Bottle',
        color: '#ffffff',
        roughness: 0.2,
        metalness: 0.0,
        lighting: 'studio',
        height: 7,
        diameter: 2.5,
        placement: {
            rotation: 0,
            offsetX: 0,
            offsetY: 0,
        },
    });

    const [logoFile, setLogoFile] = useState<{file: File, base64: string, mimeType: string} | null>(null);
    const { 
        state: design, 
        setState: setDesign, 
        undo, 
        redo, 
        canUndo, 
        canRedo, 
        reset: resetHistory 
    } = useHistoryState<DesignState>({ generatedLabel: null, generatedMockup: { front: null, back: null } });

    const [labelVariations, setLabelVariations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<GenerationStep | null>(null);
    const [triggeredAction, setTriggeredAction] = useState<TriggeredAction>(null);
    const [mockupView, setMockupView] = useState<MockupView>('front');
    const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);

    const handleLogoChange = (file: File | null) => {
        if (!file) {
            setLogoFile(null);
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            setLogoFile({ file, base64, mimeType: file.type });
        };
        reader.onerror = () => {
            setError('Could not read logo file.');
        };
    };

    const handleCustomModelChange = (file: File | null) => {
        if (customModelUrl) {
            URL.revokeObjectURL(customModelUrl);
        }
        if (file) {
            setCustomModelUrl(URL.createObjectURL(file));
        } else {
            setCustomModelUrl(null);
        }
    };

    const runGeneration = useCallback(async (action: () => Promise<any>) => {
        setIsLoading(true);
        setError(null);
        try {
            return await action();
        } catch (e: unknown) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            return null;
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
            setCurrentStep(null);
            setTriggeredAction(null);
        }
    }, []);

    const handleGenerateLabel = useCallback(async () => {
        setLabelVariations([]);
        setCurrentStep('label');
        setTriggeredAction('single');
        setLoadingMessage('Designing your label...');
        const result = await runGeneration(() => generateLabel(labelData, dimensionsData, logoFile?.base64 || null, logoFile?.mimeType || null));
        if (result) {
            setDesign({ generatedLabel: result, generatedMockup: { front: null, back: null } });
        }
    }, [labelData, dimensionsData, logoFile, runGeneration, setDesign]);
    
    const handleGenerateVariations = useCallback(async () => {
        resetHistory({ generatedLabel: null, generatedMockup: { front: null, back: null } });
        setCurrentStep('label');
        setTriggeredAction('variations');
        setLoadingMessage('Generating variations...');
        const result = await runGeneration(() => generateLabelVariations(labelData, dimensionsData, logoFile?.base64 || null, logoFile?.mimeType || null, 3));
        if (result) {
            setLabelVariations(result);
        }
    }, [labelData, dimensionsData, logoFile, runGeneration, resetHistory]);

    const handleAnalyzeImage = useCallback(async (file: File) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const mimeType = file.type;

            setLabelVariations([]);
            setCurrentStep('label');
            setTriggeredAction('analyze');
            setLoadingMessage('Analyzing image & generating design...');
            const result = await runGeneration(() => analyzeAndGenerateFromImage(base64, mimeType, labelData, dimensionsData));
            if (result) {
                resetHistory({ generatedLabel: result, generatedMockup: { front: null, back: null } });
            }
        };
        reader.onerror = () => {
            setError('Could not read the provided image file.');
        };
    }, [runGeneration, resetHistory, labelData, dimensionsData]);

    const handleSelectVariation = (selectedLabel: string) => {
        setDesign({ generatedLabel: selectedLabel, generatedMockup: { front: null, back: null } });
        setLabelVariations([]);
    };

    const handleRefine = useCallback(async (prompt: string) => {
        let imageToRefine: string | null = null;
        let refinementTarget: 'label' | 'mockup-front' | 'mockup-back' | null = null;

        if (mockupView === 'front' && design.generatedMockup.front) {
            imageToRefine = design.generatedMockup.front;
            refinementTarget = 'mockup-front';
        } else if (mockupView === 'back' && design.generatedMockup.back) {
            imageToRefine = design.generatedMockup.back;
            refinementTarget = 'mockup-back';
        } else if (!design.generatedMockup.front && !design.generatedMockup.back && design.generatedLabel) {
            imageToRefine = design.generatedLabel;
            refinementTarget = 'label';
        }

        if (!imageToRefine || !refinementTarget) {
             setError('Please generate a label or select a single mockup view (Front or Back) to refine.');
             return;
        }
        
        const isMockup = refinementTarget.startsWith('mockup');
        setCurrentStep(isMockup ? 'refineMockup' : 'refineLabel');
        setTriggeredAction('refine');
        setLoadingMessage('Applying your changes...');

        const result = await runGeneration(() => refineImage(imageToRefine!, prompt));

        if(result) {
            if (refinementTarget === 'mockup-front') {
                setDesign(prev => ({ ...prev, generatedMockup: { ...prev.generatedMockup, front: result } }));
            } else if (refinementTarget === 'mockup-back') {
                setDesign(prev => ({ ...prev, generatedMockup: { ...prev.generatedMockup, back: result } }));
            } else if (refinementTarget === 'label') {
                setDesign({ generatedLabel: result, generatedMockup: { front: null, back: null } });
            }
        }
    }, [design, runGeneration, setDesign, mockupView]);

    return (
        <div className="min-h-screen bg-gray-900 text-slate-100 p-4 lg:p-8" style={{fontFamily: "'Inter', sans-serif"}}>
            <header className="text-center mb-8">
                <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                    AI Product Label <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">Designer</span>
                </h1>
                <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">
                    Craft beautiful product labels and visualize them on realistic mockups in seconds.
                </p>
            </header>
            <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-[calc(100vh-170px)]">
                <div className="lg:col-span-2">
                    <ControlPanel
                        labelData={labelData}
                        setLabelData={setLabelData}
                        dimensionsData={dimensionsData}
                        setDimensionsData={setDimensionsData}
                        packagingData={packagingData}
                        setPackagingData={setPackagingData}
                        onLogoChange={handleLogoChange}
                        onAnalyzeImage={handleAnalyzeImage}
                        onGenerateLabel={handleGenerateLabel}
                        onGenerateVariations={handleGenerateVariations}
                        onCustomModelChange={handleCustomModelChange}
                        isLabelGenerated={!!design.generatedLabel}
                        isLoading={isLoading}
                        triggeredAction={triggeredAction}
                        setTriggeredAction={setTriggeredAction}
                        mockupView={mockupView}
                        setMockupView={setMockupView}
                    />
                </div>
                <div className="lg:col-span-3">
                    <PreviewArea
                        isLoading={isLoading}
                        loadingMessage={loadingMessage}
                        error={error}
                        generatedLabel={design.generatedLabel}
                        generatedMockup={design.generatedMockup}
                        labelVariations={labelVariations}
                        onSelectVariation={handleSelectVariation}
                        onRefine={handleRefine}
                        onUndo={undo}
                        onRedo={redo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        mockupView={mockupView}
                        dimensionsData={dimensionsData}
                        labelData={labelData}
                        packagingData={packagingData}
                        customModelUrl={customModelUrl}
                    />
                </div>
            </main>
        </div>
    );
};

export default App;
