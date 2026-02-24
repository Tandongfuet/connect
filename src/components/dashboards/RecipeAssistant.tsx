import React, { useState, useMemo } from 'react';
import { getRecipeFromIngredients } from '../../services/api';
import type { Order } from '../../types';
import Spinner from '../Spinner';
import EmptyState from '../EmptyState';
import WidgetSkeleton from '../WidgetSkeleton';

interface RecipeAssistantProps {
    orders: Order[];
}

const RecipeAssistant: React.FC<RecipeAssistantProps> = ({ orders }) => {
    const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
    const [generatedRecipe, setGeneratedRecipe] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const availableIngredients = useMemo(() => {
        const ingredients = new Map<string, string>();
        orders
            .flatMap(order => order.sellerOrders.flatMap(so => so.items))
            .forEach(item => {
                const mainIngredient = item.listing.title.split('(')[0].trim();
                if (!ingredients.has(mainIngredient)) {
                    ingredients.set(mainIngredient, item.listing.image);
                }
            });
        return Array.from(ingredients.entries());
    }, [orders]);

    const handleToggleIngredient = (ingredient: string) => {
        setSelectedIngredients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ingredient)) {
                newSet.delete(ingredient);
            } else {
                newSet.add(ingredient);
            }
            return newSet;
        });
    };

    const handleGenerateRecipe = async () => {
        if (selectedIngredients.size === 0) return;
        setLoading(true);
        setGeneratedRecipe(null);
        try {
            const recipe = await getRecipeFromIngredients(Array.from(selectedIngredients));
            setGeneratedRecipe(recipe);
        } catch (error) {
            console.error("Failed to generate recipe", error);
        } finally {
            setLoading(false);
        }
    };
    
    const formatRecipe = (text: string) => {
        return text.split('\n').map((line, index) => {
            if (line.startsWith('### ')) {
                return <h3 key={index} className="text-2xl font-bold text-slate-dark dark:text-white mt-6 mb-3">{line.substring(4)}</h3>;
            }
            if (line.startsWith('**')) {
                return <p key={index} className="font-semibold mt-4">{line.replace(/\*\*/g, '')}</p>;
            }
             if (line.startsWith('- ')) {
                return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
            }
            return <p key={index} className="mb-2">{line}</p>;
        });
    }

    if (availableIngredients.length === 0) {
        return (
            <EmptyState
                icon="🧑‍🍳"
                title="Your Kitchen is Empty"
                message="Once you've made some purchases, the ingredients will appear here. Let's find something delicious!"
                actionText="Go to Marketplace"
                actionTo="/products"
            />
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
                <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text">Your Ingredients</h2>
                <p className="text-sm text-gray-muted dark:text-dark-muted">Select items from your recent purchases to create a recipe.</p>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {availableIngredients.map(([name, imageUrl]) => (
                        <div
                            key={name}
                            onClick={() => handleToggleIngredient(name)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border-2 transition-all ${
                                selectedIngredients.has(name) ? 'border-primary bg-primary-light/30' : 'border-transparent bg-secondary dark:bg-dark-border'
                            }`}
                        >
                            <img src={imageUrl} alt={name} className="w-12 h-12 rounded-md object-cover" />
                            <span className="font-medium text-slate-dark dark:text-dark-text">{name}</span>
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleGenerateRecipe}
                    disabled={selectedIngredients.size === 0 || loading}
                    className="btn btn-primary w-full"
                >
                    {loading ? <Spinner size="sm" /> : `Generate Recipe (${selectedIngredients.size})`}
                </button>
            </div>
            <div className="lg:col-span-2">
                 <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-4">Generated Recipe</h2>
                 <div className="bg-secondary dark:bg-dark-border p-6 rounded-lg min-h-[400px]">
                    {loading && <WidgetSkeleton lines={8} />}
                    {!loading && generatedRecipe && (
                        <div className="prose dark:prose-invert max-w-none animate-fade-in">
                            {formatRecipe(generatedRecipe)}
                        </div>
                    )}
                    {!loading && !generatedRecipe && (
                         <div className="flex flex-col items-center justify-center h-full text-center text-gray-muted dark:text-dark-muted">
                            <span className="text-5xl mb-4">🧑‍🍳</span>
                            <p>Your AI-generated recipe will appear here.</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default RecipeAssistant;