
export interface LabelData {
  productName: string;
  brandName: string;
  tagline: string;
  ingredients: string;
  directions: string;
  caution: string;
  companyInfo: string;
  weight: string;
  aesthetic: string;
  colorPalette: string;
}

export interface DimensionsData {
  shape: 'rectangular' | 'circular' | 'oval' | 'square';
  width: number;
  height: number;
}

export interface LabelPlacementData {
  rotation: number;
  offsetX: number;
  offsetY: number;
}

export interface PackagingData {
  preset: 'White Plastic Shampoo Bottle' | 'Amber Glass Dropper Bottle' | 'Clear Glass Jar with Lid' | 'White Plastic Pill/Supplement Bottle' | 'Glossy Stand-up Pouch' | 'Matte Cardboard Box' | 'Frosted Plastic Tube';
  finish: string;
  height: number;
  diameter: number;
  placement: LabelPlacementData;
}

export type GenerationStep = 'label' | 'mockup' | 'refineLabel' | 'refineMockup';

export type TriggeredAction = 'single' | 'variations' | 'mockup' | 'refine' | 'analyze' | 'suggest' | null;

export type MockupView = 'front' | 'back' | 'front-back';
