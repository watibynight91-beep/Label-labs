
/**
 * Represents all the textual and stylistic information required to create a product label.
 */
export interface LabelData {
  /** The name of the product. */
  productName: string;
  /** The brand name of the product. */
  brandName: string;
  /** A short, catchy phrase for the product. */
  tagline: string;
  /** A list of ingredients used in the product. */
  ingredients: string;
  /** Instructions on how to use the product. */
  directions: string;
  /** Any cautionary information or warnings. */
  caution: string;
  /** Information about the company, such as address or website. */
  companyInfo: string;
  /** The net weight or volume of the product. */
  weight: string;
  /** The desired visual style of the label (e.g., "minimalist", "vintage"). */
  aesthetic: string;
  /** A description of the color scheme for the label. */
  colorPalette: string;
}

/**
 * Represents the physical dimensions of the label.
 */
export interface DimensionsData {
  /** The shape of the label. */
  shape: 'rectangular' | 'circular' | 'oval' | 'square';
  /** The width of the label in inches. */
  width: number;
  /** The height of the label in inches. */
  height: number;
}

/**
 * Represents the placement and orientation of the label on the packaging.
 */
export interface LabelPlacementData {
  /** The rotation of the label in degrees. */
  rotation: number;
  /** The horizontal offset of the label from the center, as a percentage. */
  offsetX: number;
  /** The vertical offset of the label from the center, as a percentage. */
  offsetY: number;
}

/**
 * Represents the properties of the product packaging for mockup generation.
 */
export interface PackagingData {
  /** The type of packaging container. */
  preset: 'White Plastic Shampoo Bottle' | 'Amber Glass Dropper Bottle' | 'Clear Glass Jar with Lid' | 'White Plastic Pill/Supplement Bottle' | 'Glossy Stand-up Pouch' | 'Matte Cardboard Box' | 'Frosted Plastic Tube';
  /** The surface finish of the container (e.g., "glossy", "matte"). */
  finish: string;
  /** The height of the packaging in inches. */
  height: number;
  /** The diameter of the packaging in inches. */
  diameter: number;
  /** The placement of the label on the packaging. */
  placement: LabelPlacementData;
}

/**
 * Defines the current step in the AI generation process, used for tracking and UI state.
 */
export type GenerationStep = 'label' | 'mockup' | 'refineLabel' | 'refineMockup';

/**
 * Defines the specific user-triggered action that initiated an AI process.
 * This helps in displaying the correct loading state and messages.
 */
export type TriggeredAction = 'single' | 'variations' | 'mockup' | 'refine' | 'analyze' | 'suggest' | null;

/**
 * Defines the view perspective for the product mockup.
 */
export type MockupView = 'front' | 'back' | 'front-back';
