
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { GoogleGenAI } from '@google/genai';
import User from '../models/userModel';

// Initialize the AI client securely on the server (or provide a noop stub when the key is missing)
let ai: any;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn('WARNING: API_KEY not set; AI endpoints will return fallback or empty results.');
    // minimal stub that returns an empty response object
    ai = {
        models: {
            generateContent: async () => ({ text: '', candidates: [] }),
        },
    };
} 

/**
 * @desc    Generate article content using AI
 * @route   POST /api/ai/generate-article
 * @access  Private/Admin
 */
const generateArticle = asyncHandler(async (req: Request, res: Response) => {
    const { prompt } = req.body;

    if (!prompt) {
        res.status(400);
        throw new Error('Prompt is required');
    }

    try {
        const fullPrompt = `You are an agricultural expert writing for AgroConnect, a platform for Cameroonian farmers. Write a comprehensive and practical article about "${prompt}". The article should be engaging, well-structured, and use Markdown for formatting. Use '###' for subheadings, '**text**' for bold, and '- item' for lists.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: fullPrompt
        });

        const content = response.text;
        res.json({ content });

    } catch (error) {
        console.error('AI generation error:', error);
        res.status(503);
        throw new Error('AI service unavailable. Please try again later.');
    }
});


/**
 * @desc    Generate growth advice using AI
 * @route   GET /api/ai/growth-advice
 * @access  Private
 */
const getGrowthAdvice = asyncHandler(async (req: Request, res: Response) => {
    try {
        const prompt = "Provide one actionable piece of growth advice for a small-scale farmer or service provider on an e-commerce platform in Cameroon. Be specific and encouraging. Use markdown for emphasis.";
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        res.json({ advice: response.text });
    } catch (error) {
        console.error('AI growth advice generation error:', error);
        // Fallback advice
        res.json({ advice: "**Tip:** Consistently updating your inventory and responding quickly to messages helps build trust with buyers!" });
    }
});

/**
 * @desc    Generate semantic keywords for search
 * @route   POST /api/ai/semantic-keywords
 * @access  Public
 */
const getSemanticKeywords = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.body;
    if (!query) {
        res.status(400);
        throw new Error('Query is required');
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Given the search query "${query}", provide 3-4 related keywords or synonyms relevant to agriculture in Cameroon. Return a comma-separated list. For example, for "potatoes", you might return "tubers, fufu, highland crops".`
        });
        res.json({ keywords: response.text.split(',').map((k: string) => k.trim()) });
    } catch (error) {
        console.error('AI keyword generation error:', error);
        // Fallback: just return the original query as the only keyword
        res.json({ keywords: [query] });
    }
});


/**
 * @desc    Get price suggestion for a listing
 * @route   POST /api/ai/price-suggestion
 * @access  Private
 */
const getPriceSuggestion = asyncHandler(async (req: Request, res: Response) => {
    const { title, category, imageUrl } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Based on the product title "${title}", category "${category}", and its image, suggest a fair market price in XAF for Cameroon. Provide a brief justification. For example: "Suggested Price: 5,000 XAF. This is a competitive price for a 10kg bag of potatoes in the current season."`
        });
        res.json({ suggestion: response.text });
    } catch (error) {
        console.error('AI price suggestion error:', error);
        res.json({ suggestion: "AI pricing currently unavailable. Please research similar listings for a fair price." });
    }
});

/**
 * @desc    Generate tags for a listing
 * @route   POST /api/ai/generate-tags
 * @access  Private
 */
const generateTags = asyncHandler(async (req: Request, res: Response) => {
    const { title, description, category } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Based on the listing title "${title}", description "${description}", and category "${category}", generate 5-7 relevant comma-separated tags to improve searchability.`
        });
        res.json({ tags: response.text });
    } catch (error) {
        console.error('AI tag generation error:', error);
        res.json({ tags: `${category}, ${title.split(' ').join(', ')}` });
    }
});


/**
 * @desc    Generate listing content from image and tags
 * @route   POST /api/ai/generate-listing-content
 * @access  Private
 */
const generateListingContent = asyncHandler(async (req: Request, res: Response) => {
    const { imageUrl, tags } = req.body;
    try {
        const imagePart = { inlineData: { mimeType: 'image/jpeg', data: imageUrl.split(',')[1] } };
        const textPart = { text: `Analyze this image of an agricultural product. Based on the image and the keywords "${tags}", generate a concise and appealing listing title and description. Return the response as a JSON object with keys "title" and "description".` };

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, textPart] },
            config: { responseMimeType: 'application/json' }
        });
        
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error('AI listing content generation error:', error);
        res.status(503);
        throw new Error('AI content generation unavailable.');
    }
});

/**
 * @desc    Get response from AgroBot
 * @route   POST /api/ai/agrobot
 * @access  Private
 */
const getAgroBotResponse = asyncHandler(async (req: Request, res: Response) => {
    const { message, context, useWebSearch } = req.body;
    try {
        let prompt = `You are AgroBot, an AI assistant for an agricultural platform in Cameroon called AgroConnect. Context: ${context}. User's question: "${message}".`;
        if (useWebSearch) {
            prompt += ' Use web search to provide the most up-to-date information.';
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: useWebSearch ? { tools: [{ googleSearch: {} }] } : {}
        });

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            title: chunk.web?.title || chunk.web?.uri,
            uri: chunk.web?.uri
        })).filter((s:any) => s.uri);

        res.json({ text: response.text, sources: sources });
    } catch (error) {
        console.error('AgroBot error:', error);
        res.json({ text: "I'm having trouble connecting to my brain right now. Please try again in a moment." });
    }
});

/**
 * @desc    Get recipe from ingredients
 * @route   POST /api/ai/recipe
 * @access  Private
 */
const getRecipeFromIngredients = asyncHandler(async (req: Request, res: Response) => {
    const { ingredients } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create a simple Cameroonian recipe using the following ingredients: ${ingredients.join(', ')}. Include a title, ingredients list, and step-by-step instructions. Use markdown formatting.`
        });
        res.json({ recipe: response.text });
    } catch (error) {
        console.error('AI recipe error:', error);
        res.status(503);
        throw new Error('AI recipe generation unavailable.');
    }
});

/**
 * @desc    Generate marketing text
 * @route   POST /api/ai/marketing-text
 * @access  Private
 */
const generateMarketingText = asyncHandler(async (req: Request, res: Response) => {
    const { productName, type } = req.body;
    try {
        const prompt = type === 'description'
            ? `Write an engaging, short product description for "${productName}" for an e-commerce platform.`
            : `Write a short and exciting WhatsApp promotional message for a product called "${productName}". Include emojis.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        res.json({ text: response.text });
    } catch (error) {
         console.error('AI marketing text error:', error);
         res.status(503);
         throw new Error('AI marketing tool unavailable.');
    }
});

/**
 * @desc    Ask a question about an article
 * @route   POST /api/ai/ask-article
 * @access  Private
 */
const askAboutArticle = asyncHandler(async (req: Request, res: Response) => {
    const { articleContent, question } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Based on the following article content, answer the user's question. Article: "${articleContent}". Question: "${question}".`
        });
        res.json({ answer: response.text });
    } catch (error) {
        console.error('AI article QA error:', error);
        res.json({ answer: "I couldn't analyze the article at this moment. Please try again." });
    }
});

/**
 * @desc    Perform OCR and Verification on ID images
 * @route   POST /api/ai/ocr
 * @access  Private/Admin
 */
const performOcr = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.body;
    const user = await User.findById(userId);
    
    if (!user || !user.nationalIdImages || user.nationalIdImages.length === 0) {
        res.status(400);
        throw new Error('User or ID images not found.');
    }

    // Prepare parts for Gemini Vision
    const parts = [];
    for (const imgStr of user.nationalIdImages) {
        if (imgStr.startsWith('data:image')) {
            const mimeType = imgStr.split(';')[0].split(':')[1];
            const data = imgStr.split(',')[1];
            parts.push({ inlineData: { mimeType, data } });
        }
    }
    
    if (parts.length === 0) {
         res.json({ nameMatch: false, idMatch: false, summary: "No readable images found." });
         return;
    }

    const prompt = `Analyze these images of a National ID card. 
    Extract the name and ID number. 
    Compare them with the provided user details: 
    Name: "${user.name}"
    ID Number: "${user.nationalIdNumber}"
    
    Return a JSON object with:
    - nameMatch: boolean (true if the name on ID reasonably matches user name)
    - idMatch: boolean (true if ID number matches)
    - summary: A short summary string describing the verification result.`;

    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts },
            config: { responseMimeType: 'application/json' }
        });
        
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error("OCR Error:", error);
        res.json({ 
            nameMatch: false, 
            idMatch: false, 
            summary: "AI analysis failed due to technical issues. Manual review required." 
        });
    }
});


export { 
    generateArticle, 
    getGrowthAdvice,
    getSemanticKeywords,
    getPriceSuggestion,
    generateTags,
    generateListingContent,
    getAgroBotResponse,
    getRecipeFromIngredients,
    generateMarketingText,
    askAboutArticle,
    performOcr
};
