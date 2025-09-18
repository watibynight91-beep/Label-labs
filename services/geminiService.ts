
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { LabelData, DimensionsData, PackagingData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const imageModel = 'gemini-2.5-flash-image-preview';
const textModel = 'gemini-2.5-flash';


const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

export const generateTextSuggestions = async (
  field: 'productName' | 'tagline' | 'aesthetic' | 'colorPalette',
  labelData: LabelData
): Promise<string[]> => {
  let prompt: string;

  if (field === 'tagline') {
    prompt = `Based on the product name "${labelData.productName}", its aesthetic "${labelData.aesthetic}", and ingredients like "${labelData.ingredients}", generate 5 creative and concise taglines.`;
  } else if (field === 'productName') {
    prompt = `Based on the brand name "${labelData.brandName}", its aesthetic "${labelData.aesthetic}", and ingredients like "${labelData.ingredients}", generate 5 creative and appealing product names.`;
  } else if (field === 'aesthetic') {
    prompt = `Based on the product name "${labelData.productName}", brand name "${labelData.brandName}", and ingredients like "${labelData.ingredients}", generate 5 descriptive aesthetic styles for a product label. Examples: "minimalist and clean", "vintage botanical illustration", "bold and modern geometric".`;
  } else { // colorPalette
    prompt = `Based on the product name "${labelData.productName}", ingredients "${labelData.ingredients}", and the aesthetic "${labelData.aesthetic}", generate 5 compelling color palette descriptions for a product label. Examples: "earthy tones of terracotta and sage", "a pastel palette of soft pink and mint green", "a vibrant combination of electric blue and citrus yellow".`;
  }
  
  prompt += ' Return the response as a JSON array of strings.';

  try {
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        },
    });
    
    const jsonStr = response.text.trim();
    const suggestions = JSON.parse(jsonStr);

    if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
      return suggestions;
    }
    return [];

  } catch (error) {
    console.error("Error generating text suggestions:", error);
    throw new Error("Could not generate suggestions. The AI failed to return a valid response.");
  }
};

export const generatePackagingSuggestions = async (
  labelData: LabelData
): Promise<Partial<PackagingData>> => {
    const prompt = `
        Based on the provided product information, suggest the ideal packaging.
        Product Name: "${labelData.productName}"
        Ingredients: "${labelData.ingredients}"
        Aesthetic: "${labelData.aesthetic}"

        Consider the product type implied by its name and ingredients (e.g., shampoo, serum, cream, supplement).
        Suggest a suitable packaging preset, a finish, and typical dimensions (height and diameter in inches).

        The available presets are: "White Plastic Shampoo Bottle", "Amber Glass Dropper Bottle", "Clear Glass Jar with Lid", "White Plastic Pill/Supplement Bottle", "Glossy Stand-up Pouch", "Matte Cardboard Box", "Frosted Plastic Tube".

        Return your response as a single JSON object with the keys "preset", "finish", "height", and "diameter".
        - "preset" must be one of the provided options.
        - "finish" should be a short descriptive string (e.g., "matte", "glossy", "satin").
        - "height" and "diameter" must be numbers.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        preset: { 
                            type: Type.STRING,
                            description: 'The type of packaging container.',
                        },
                        finish: { 
                            type: Type.STRING,
                            description: 'The surface finish of the container.'
                        },
                        height: { 
                            type: Type.NUMBER,
                            description: 'The height of the container in inches.'
                        },
                        diameter: { 
                            type: Type.NUMBER,
                            description: 'The diameter of the container in inches.'
                        }
                    },
                    required: ["preset", "finish", "height", "diameter"]
                }
            }
        });
        
        const jsonStr = response.text.trim();
        const suggestions = JSON.parse(jsonStr);

        if (suggestions && typeof suggestions.preset === 'string' && typeof suggestions.finish === 'string' && typeof suggestions.height === 'number' && typeof suggestions.diameter === 'number') {
            return suggestions;
        }
        
        throw new Error("AI returned an invalid data structure for packaging suggestions.");

    } catch (error) {
        console.error("Error generating packaging suggestions:", error);
        throw new Error("Could not generate packaging suggestions. The AI failed to return a valid response.");
    }
};


export const generateLabel = async (
  labelData: LabelData,
  dimensionsData: DimensionsData,
  logoBase64: string | null,
  logoMimeType: string | null
): Promise<string> => {
    const { 
        productName, brandName, tagline, ingredients, directions, 
        caution, companyInfo, weight, aesthetic, colorPalette 
    } = labelData;
    const { shape, width, height } = dimensionsData;

    const prompt = `
      You are a world-class graphic designer specializing in product labels. Your task is to create a stunning, print-quality, full wrap-around label design meant to be applied to a product.

      The label should be designed as a single flat rectangle, with three distinct panels arranged horizontally: Left Panel, Center Panel (the front), and Right Panel.

      **Instructions:**

      **1. Overall Style:**
      - The brand name is "${brandName}".
      - The aesthetic must be "${aesthetic}" with a "${colorPalette}" color palette.
      - The final output is a single rectangular image with an aspect ratio of approximately ${width} wide to ${height} tall. This will be wrapped around the product. Maintain this aspect ratio.
      - **Important for printing:** The background color, patterns, or textures must extend approximately 0.125 inches beyond the main content area on all sides to create a 'bleed'. Do not put any critical text or elements in this bleed area. The core design should be centered within the bleed.

      **2. Center Panel (Front of Product):**
      - This is the main focus and should be the most visually appealing part.
      - Feature the product name prominently: "${productName}".
      - Include the tagline: "${tagline}".
      - Display the net weight: "${weight}".
      - The brand name "${brandName}" should also be clearly visible.
      ${logoBase64 ? '- The user has provided their logo. Integrate it naturally into the design, usually at the top or top-center of this panel.' : ''}

      **3. Left Panel (Side 1):**
      - Create a section titled "INGREDIENTS" and list the following: "${ingredients}".
      - Create a section titled "DIRECTIONS FOR USE" with the text: "${directions}".
      - Format these sections with a clean, highly legible font.

      **4. Right Panel (Side 2):**
      - Create a section for company information: "${companyInfo}".
      - Create a section titled "CAUTION" with the text: "${caution}".
      - Include a standard, generic barcode placeholder.
      - Include a standard recycling symbol.

      **Layout Guidelines:**
      - Ensure clear but seamless visual separation between the panels. They should flow together as one cohesive design. Use subtle lines, color blocking, or spacing to delineate the sections.
      - Use professional typography throughout. Ensure all text is legible with high contrast against its background.
      - The output should be JUST the label image itself on a transparent or neutral background. Do not add any descriptive text outside the label design.
    `;

    const imageParts = [];
    if (logoBase64 && logoMimeType) {
      imageParts.push(fileToGenerativePart(logoBase64, logoMimeType));
    } else {
        // Provide a base color swatch to guide the model if no logo is present
        const baseColorPrompt = `A simple solid color block representing a ${colorPalette} color palette for a product label.`;
        const baseImageResponse = await ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: baseColorPrompt });
        if(baseImageResponse.generatedImages && baseImageResponse.generatedImages.length > 0) {
            const base64Image = baseImageResponse.generatedImages[0].image.imageBytes;
            imageParts.push(fileToGenerativePart(base64Image, 'image/png'));
        }
    }

    const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
            parts: [...imageParts, { text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }

    throw new Error("Could not generate label image. The AI did not return an image.");
};


export const refineImage = async (
  currentImageBase64: string,
  refinementPrompt: string
): Promise<string> => {
    const prompt = `
      You are an expert photo editor and graphic designer. The user has provided an image and a request for a change.
      
      **User's Request:** "${refinementPrompt}"

      Apply this change precisely while maintaining the overall quality and style of the original image.
    `;

    const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
            parts: [fileToGenerativePart(currentImageBase64, 'image/png'), { text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }

    throw new Error("Could not refine image. The AI did not return an image.");
};

export const generateLabelVariations = async (
  labelData: LabelData,
  dimensionsData: DimensionsData,
  logoBase64: string | null,
  logoMimeType: string | null,
  count: number = 3
): Promise<string[]> => {
    const generationPromises: Promise<string>[] = [];
    for (let i = 0; i < count; i++) {
        // Each call to generateLabel will produce a variation due to the model's creative nature.
        generationPromises.push(generateLabel(labelData, dimensionsData, logoBase64, logoMimeType));
    }

    const results = await Promise.all(generationPromises);
    
    if (results.some(res => !res)) {
        throw new Error("One or more variations failed to generate.");
    }
    
    return results;
};

export const analyzeAndGenerateFromImage = async (
  imageBase64: string,
  mimeType: string,
  labelData: LabelData,
  dimensionsData: DimensionsData
): Promise<string> => {
  const { 
      productName, brandName, tagline, ingredients, directions, 
      caution, companyInfo, weight 
  } = labelData;
  const { width, height } = dimensionsData;

  const prompt = `
    You are a world-class graphic designer specializing in product labels. Your task is to create a stunning, print-quality, full wrap-around label.

    You have been given an image of an existing label to use as **style inspiration**.

    **Instructions:**

    **1. Analyze Style (From Provided Image):**
    - First, deeply analyze the provided image. Identify its core aesthetic, color palette, typography style (e.g., serif, sans-serif, script), layout principles, and overall mood (e.g., luxurious, minimalist, rustic).

    **2. Create a New Label (Using Inspired Style and New Content):**
    - Now, using the style you just analyzed as your inspiration, create a **completely new** label design.
    - This new label must be a single flat rectangle, with three distinct panels arranged horizontally: Left Panel, Center Panel (the front), and Right Panel.
    - The final output is a single rectangular image with an aspect ratio of approximately ${width} wide to ${height} tall. Maintain this aspect ratio.
    - **Important for printing:** The background color, patterns, or textures must extend approximately 0.125 inches beyond the main content area on all sides to create a 'bleed'. Do not put any critical text or elements in this bleed area. The core design should be centered within the bleed.

    **3. Center Panel (Front of Product - USE THIS EXACT TEXT):**
    - This is the main focus. Apply the inspired style here.
    - Feature the product name prominently: "${productName}".
    - Include the tagline: "${tagline}".
    - Display the net weight: "${weight}".
    - The brand name "${brandName}" should also be clearly visible.

    **4. Left Panel (Side 1 - USE THIS EXACT TEXT):**
    - Create a section titled "INGREDIENTS" and list the following: "${ingredients}".
    - Create a section titled "DIRECTIONS FOR USE" with the text: "${directions}".
    - Format these sections with a clean, highly legible font that complements the inspired style.

    **5. Right Panel (Side 2 - USE THIS EXACT TEXT):**
    - Create a section for company information: "${companyInfo}".
    - Create a section titled "CAUTION" with the text: "${caution}".
    - Include a standard, generic barcode placeholder.
    - Include a standard recycling symbol.

    **Layout Guidelines:**
    - Ensure clear but seamless visual separation between the panels. They should flow together.
    - The output should be JUST the label image itself on a transparent or neutral background. Do not add any descriptive text or your analysis outside the label design.
  `;

  const response = await ai.models.generateContent({
    model: imageModel,
    contents: {
      parts: [fileToGenerativePart(imageBase64, mimeType), { text: prompt }],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }

  throw new Error("Could not generate a similar design. The AI did not return an image.");
};
