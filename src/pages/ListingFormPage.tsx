import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import { getListingById, createListing, updateListing, getPriceSuggestion, generateTags, generateListingContentFromAI } from '../services/api';
import { ImageStatus } from '../constants';
import type { ListingImage, TieredPrice } from '../types';
import { useRole } from '../hooks/useRole';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import ImageCropperModal from '../components/ImageCropperModal';
import GeneralPageSkeleton from '../components/GeneralPageSkeleton';


const MAX_FILE_SIZE_MB = 5;
const MIN_FILE_SIZE_KB = 50;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_IMAGES = 8;
const MAX_VIDEO_SIZE_MB = 25;

const SUGGESTED_CATEGORIES = [
    'Vegetables',
    'Fruits',
    'Grains',
    'Livestock',
    'Poultry',
    'Tools',
    'Fertilizers',
    'Crafts',
    'Services',
];

const ListingFormPage: React.FC = () => {
    const { listingId } = useParams<{ listingId: string }>();
    const isEditing = !!listingId;
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { user } = useAuth();
    const { isVerified } = useRole();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditing);
    const [isDragging, setIsDragging] = useState(false);
    
    // AI State
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [tags, setTags] = useState('');
    const [priceSuggestion, setPriceSuggestion] = useState('');
    const [isPriceLoading, setIsPriceLoading] = useState(false);
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [isTagsLoading, setIsTagsLoading] = useState(false);

    // Image Upload & Cropping State
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [imageQueue, setImageQueue] = useState<string[]>([]);

    // Video State
    const [videoLoading, setVideoLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        isService: false,
        isBulk: false,
        promoVideoUrl: '',
    });
    const [images, setImages] = useState<ListingImage[]>([]);
    const [tieredPricing, setTieredPricing] = useState<TieredPrice[]>([{ quantity: 10, price: 0 }]);

    useEffect(() => {
        if (!isVerified) {
            addToast('You must verify your identity before creating a listing.', 'error');
            navigate('/dashboard', { replace: true });
        }
    }, [isVerified, navigate, addToast]);

    useEffect(() => {
        if (isEditing && listingId) {
            getListingById(listingId).then(listing => {
                if (listing) {
                    setFormData({
                        title: listing.title,
                        description: listing.description,
                        price: String(listing.price),
                        category: listing.category,
                        stock: String(listing.stock || ''),
                        isService: listing.isService,
                        isBulk: listing.isBulk || false,
                        promoVideoUrl: listing.promoVideoUrl || '',
                    });
                    setImages(listing.images);
                    if (listing.tieredPricing && listing.tieredPricing.length > 0) {
                        setTieredPricing(listing.tieredPricing);
                    }
                } else {
                    addToast('Listing not found.', 'error');
                    navigate('/dashboard');
                }
            }).finally(() => setPageLoading(false));
        } else {
            setPageLoading(false);
        }
    }, [listingId, isEditing, navigate, addToast]);
    
    useEffect(() => {
        if (imageQueue.length > 0 && !imageToCrop) {
            const nextImage = imageQueue[0];
            setImageQueue(prev => prev.slice(1));
            setImageToCrop(nextImage);
        }
    }, [imageQueue, imageToCrop]);

    const handleCropSave = (croppedImageUrl: string) => {
        setImages(prev => [...prev, { url: croppedImageUrl, status: ImageStatus.Pending }]);
        setImageToCrop(null);
    };

    const processFiles = (filesToProcess: File[]) => {
        if (images.length + filesToProcess.length > MAX_IMAGES) {
            addToast(`You can only upload a maximum of ${MAX_IMAGES} images.`, 'error');
            return;
        }

        const validFiles = filesToProcess.filter(file => {
            const fileSizeKB = file.size / 1024;
            const fileSizeMB = fileSizeKB / 1024;

            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                addToast(`Unsupported file type: "${file.name}". Please use JPG or PNG.`, 'error');
                return false;
            }
            if (fileSizeMB > MAX_FILE_SIZE_MB) {
                addToast(`"${file.name}" is too large (${fileSizeMB.toFixed(1)}MB). Max size is ${MAX_FILE_SIZE_MB}MB.`, 'error');
                return false;
            }
            if (fileSizeKB < MIN_FILE_SIZE_KB) {
                addToast(`"${file.name}" is too small (${fileSizeKB.toFixed(1)}KB). Min size is ${MIN_FILE_SIZE_KB}KB.`, 'error');
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        let filesRead = 0;
        const dataUrls: string[] = [];

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                dataUrls.push(reader.result as string);
                filesRead++;
                if (filesRead === validFiles.length) {
                    setImageQueue(prev => [...prev, ...dataUrls]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        processFiles(Array.from(e.target.files));
        e.target.value = '';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    };
    
    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const input = e.target;
        if (!file) return;

        setFormData(prev => ({ ...prev, promoVideoUrl: '' }));
        setVideoLoading(true);

        if (!file.type.startsWith('video/')) {
            addToast('Please upload a valid video file.', 'error');
            setVideoLoading(false);
            input.value = '';
            return;
        }
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
            addToast(`Video file is too large (max ${MAX_VIDEO_SIZE_MB}MB).`, 'error');
            setVideoLoading(false);
            input.value = '';
            return;
        }
        
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            const duration = video.duration;
            if (duration < 8 || duration > 15) {
                addToast(`Video must be between 8 and 15 seconds long. Yours is ${Math.round(duration)}s.`, 'error');
                setVideoLoading(false);
                input.value = '';
            } else {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({...prev, promoVideoUrl: reader.result as string}));
                    setVideoLoading(false);
                };
                reader.readAsDataURL(file);
            }
        };
        video.onerror = () => {
            addToast('Could not read video metadata. The file may be corrupt.', 'error');
            setVideoLoading(false);
            input.value = '';
        };
        video.src = URL.createObjectURL(file);
    };

    const removeVideo = () => {
        setFormData(prev => ({ ...prev, promoVideoUrl: '' }));
        const fileInput = document.getElementById('promoVideoFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    
    const handleTierChange = (index: number, field: keyof TieredPrice, value: string) => {
        const newTiers = [...tieredPricing];
        newTiers[index] = { ...newTiers[index], [field]: Number(value) || 0 };
        setTieredPricing(newTiers);
    };

    const addTier = () => setTieredPricing([...tieredPricing, { quantity: 0, price: 0 }]);
    const removeTier = (index: number) => setTieredPricing(tieredPricing.filter((_, i) => i !== index));

    const handleGenerateWithAI = async () => {
        if (images.length === 0) {
            addToast("Please upload an image first to use the AI assistant.", 'info');
            return;
        }
        setIsAiLoading(true);
        try {
            const resultJson = await generateListingContentFromAI(images[0].url, tags);
            
            if (resultJson.title && resultJson.description) {
                setFormData(prev => ({
                    ...prev,
                    title: resultJson.title,
                    description: resultJson.description
                }));
                addToast("AI-generated content has been populated!", 'success');
            } else {
                throw new Error("AI response was not in the expected format.");
            }
        } catch (error: any) {
            console.error("AI Generation Error:", error);
            addToast(error.message || "Could not generate content. Please try again.", 'error');
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleGetPriceSuggestion = async () => {
        if (!formData.title || !formData.category) {
            addToast("Please fill in the Title and Category before suggesting a price.", "info");
            return;
        }
        if (images.length === 0) {
            addToast("Please upload an image for a more accurate price suggestion.", "info");
            return;
        }
        setIsPriceLoading(true);
        setPriceSuggestion('');
        try {
            const suggestion = await getPriceSuggestion(formData.title, formData.category, images[0].url);
            setPriceSuggestion(suggestion);
        } catch (error: any) {
            addToast(error.message, "error");
        } finally {
            setIsPriceLoading(false);
        }
    };

    const handleSuggestTags = async () => {
        if (!formData.title || !formData.description || !formData.category) {
            addToast("Please fill in Title, Description, and Category before suggesting tags.", "info");
            return;
        }
        setIsTagsLoading(true);
        setSuggestedTags([]);
        try {
            const tagsString = await generateTags(formData.title, formData.description, formData.category);
            setSuggestedTags(tagsString.split(',').map(t => t.trim()).filter(Boolean));
        } catch (error: any) {
            addToast(error.message, "error");
        } finally {
            setIsTagsLoading(false);
        }
    };

    const handleTagClick = (tag: string) => {
        if (!tags.toLowerCase().split(',').map(t => t.trim()).includes(tag.toLowerCase())) {
            setTags(prev => prev ? `${prev}, ${tag}` : tag);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (images.length === 0) {
            addToast('Please upload at least one image.', 'error');
            return;
        }

        if (formData.isBulk) {
            for (let i = 0; i < tieredPricing.length; i++) {
                const tier = tieredPricing[i];
                if (tier.quantity <= 0 || tier.price <= 0) {
                    addToast(`Bulk pricing error: Tier ${i + 1} must have a quantity and price greater than zero.`, 'error');
                    return;
                }
                if (i > 0 && tieredPricing[i].quantity <= tieredPricing[i - 1].quantity) {
                    addToast('Bulk pricing error: Quantities must be in increasing order.', 'error');
                    return;
                }
            }
        }
        
        setLoading(true);
        const listingData = {
            ...formData,
            price: parseFloat(formData.price),
            stock: formData.isService ? undefined : parseInt(formData.stock || '0', 10),
            images,
            tieredPricing: formData.isBulk ? tieredPricing.filter(t => t.quantity > 0 && t.price > 0) : [],
        };
        
        try {
            if (isEditing && listingId) {
                await updateListing(listingId, listingData);
                addToast(`Listing updated successfully!`, 'success');
            } else {
                // FIX: Passed user as the second argument to createListing.
                await createListing(listingData, user);
                addToast(isVerified ? 'Listing published successfully!' : "Listing created successfully! It's now pending review.", 'success');
            }
            navigate('/dashboard');
        } catch (error: any) {
            addToast(error.message || 'Failed to save listing.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // DropZone component for reuse
    const DropZone: React.FC<{ id: string }> = ({ id }) => (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`mt-1 flex h-full justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors duration-200 dark:bg-gray-700/50 ${
                isDragging ? 'border-primary bg-primary-light/20' : 'border-olive-light dark:border-gray-600 hover:border-primary-light'
            }`}
        >
            <div className="space-y-1 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label htmlFor={id} className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        <span>Click to upload</span>
                        <input id={id} name={id} type="file" className="sr-only" multiple onChange={handleImageUpload} accept="image/png, image/jpeg, image/jpg" disabled={images.length >= MAX_IMAGES} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-muted dark:text-gray-500">PNG, JPG up to 5MB</p>
            </div>
        </div>
    );

    if (pageLoading) return <GeneralPageSkeleton />;

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <ImageCropperModal isOpen={!!imageToCrop} onClose={() => setImageToCrop(null)} imageSrc={imageToCrop} onSave={handleCropSave} />
            <BreadcrumbNavigation
                paths={[
                    { name: 'Dashboard', path: '/dashboard' },
                    { name: isEditing ? 'Edit Listing' : 'New Listing' }
                ]}
            />
            <h1 className="text-3xl font-bold text-slate-dark dark:text-white mb-8">{isEditing ? 'Edit Listing' : 'Create a New Listing'}</h1>
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                     <div>
                         <label className="label">Images (up to {MAX_IMAGES})</label>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DropZone id="file-upload-1" />
                            <DropZone id="file-upload-2" />
                        </div>
                         {images.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {images.map((image, index) => (
                                    <div key={index} className="relative group">
                                        <img src={image.url} alt={`preview ${index}`} className="h-24 w-full object-cover rounded-md border dark:border-gray-700" />
                                        <button 
                                            type="button" 
                                            onClick={() => removeImage(index)} 
                                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-7 w-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            aria-label="Remove image"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                         )}
                    </div>

                    <div>
                        <label htmlFor="title" className="label">Listing Title</label>
                        <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="input" />
                    </div>
                     <div>
                        <label htmlFor="description" className="label">Description</label>
                        <textarea name="description" id="description" rows={4} value={formData.description} onChange={handleChange} required className="input"></textarea>
                    </div>

                    <div>
                        <label htmlFor="promoVideoFile" className="label">Promotional Video (Optional, 8-15s)</label>
                        <input 
                            type="file" 
                            name="promoVideoFile" 
                            id="promoVideoFile" 
                            accept="video/mp4,video/webm"
                            onChange={handleVideoUpload}
                            className="input"
                        />
                        {videoLoading && <div className="mt-2 flex items-center gap-2"><Spinner size="sm" /> <span className="text-sm text-gray-muted">Processing video...</span></div>}
                        {formData.promoVideoUrl && !videoLoading && (
                            <div className="mt-2 relative">
                                <video src={formData.promoVideoUrl} controls className="w-full max-w-sm rounded-lg shadow-md"></video>
                                <button type="button" onClick={removeVideo} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-7 w-7 flex items-center justify-center shadow-lg" aria-label="Remove video">&times;</button>
                            </div>
                        )}
                        <p className="text-xs text-gray-muted mt-1">Upload a short video (8-15 seconds, max 25MB) to showcase your product.</p>
                    </div>

                    <div>
                        <label htmlFor="category" className="label">Category</label>
                        <input 
                            type="text"
                            name="category"
                            id="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            list="category-suggestions"
                            placeholder="e.g., Vegetables"
                            className="input"
                        />
                        <datalist id="category-suggestions">
                            {SUGGESTED_CATEGORIES.map(cat => <option key={cat} value={cat} />)}
                        </datalist>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 space-y-4">
                        <h3 className="font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">✨ AI Listing Assistant</h3>
                        
                        <div>
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                                <strong>Step 1 (Optional):</strong> Let AI suggest optimized tags based on your title and description to improve search visibility.
                            </p>
                            <button type="button" onClick={handleSuggestTags} className="btn btn-secondary mt-2" disabled={isTagsLoading || !formData.title || !formData.description || !formData.category}>
                                {isTagsLoading ? <Spinner size="sm"/> : 'Suggest Tags with AI'}
                            </button>
                            {suggestedTags.length > 0 && (
                                <div className="mt-3 animate-fade-in">
                                    <p className="text-xs font-semibold text-purple-800 dark:text-purple-200">Click to add suggested tags:</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {suggestedTags.map((tag, index) => (
                                            <button type="button" key={index} onClick={() => handleTagClick(tag)} className="btn btn-sm bg-purple-200 text-purple-800 hover:bg-purple-300">
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-purple-200 dark:border-purple-700">
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                                <strong>Step 2:</strong> Use your first image and optional tags to generate a title and description automatically.
                            </p>
                            <div className="flex gap-2 mt-2">
                                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Add tags/keywords..." className="input flex-grow" />
                                <button type="button" onClick={handleGenerateWithAI} className="btn btn-primary" disabled={isAiLoading || images.length === 0} style={{backgroundColor: '#6b21a8'}}>
                                    {isAiLoading ? <Spinner size="sm"/> : 'Generate Content'}
                                </button>
                            </div>
                        </div>
                    </div>

                     <div>
                        <label htmlFor="price" className="label">Price (XAF)</label>
                        <div className="flex items-center gap-2">
                             <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required min="0" step="1" className="input flex-grow" />
                             <button type="button" onClick={handleGetPriceSuggestion} className="btn btn-secondary" disabled={isPriceLoading || !formData.title || !formData.category || images.length === 0}>
                                {isPriceLoading ? <Spinner size="sm" /> : 'Suggest Price'}
                            </button>
                        </div>
                        {priceSuggestion && (
                            <p className="text-sm text-green-700 dark:text-green-300 mt-2 bg-green-50 dark:bg-green-900/20 p-2 rounded-md animate-fade-in">{priceSuggestion}</p>
                        )}
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="isService" id="isService" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" checked={formData.isService} onChange={handleChange} />
                        <label htmlFor="isService" className="ml-2 block text-sm text-slate-dark dark:text-gray-300">This is a service</label>
                    </div>
                     {!formData.isService && (
                        <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                           <div>
                                <label htmlFor="stock" className="label">Stock Quantity</label>
                                <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} min="0" className="input" />
                           </div>
                           <div className="flex items-center">
                                <input type="checkbox" name="isBulk" id="isBulk" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" checked={formData.isBulk} onChange={handleChange} />
                                <label htmlFor="isBulk" className="ml-2 block text-sm text-slate-dark dark:text-gray-300">Offer bulk pricing / wholesale</label>
                           </div>
                           {formData.isBulk && (
                               <div className="p-4 bg-secondary dark:bg-gray-700/50 rounded-lg space-y-3 animate-fade-in">
                                   <h4 className="font-semibold text-slate-dark dark:text-white">Tiered Pricing</h4>
                                   {tieredPricing.map((tier, index) => (
                                       <div key={index} className="flex items-center gap-2">
                                           <span className="text-sm">Buy</span>
                                           <input type="number" value={tier.quantity || ''} onChange={e => handleTierChange(index, 'quantity', e.target.value)} className="input w-24" placeholder="e.g., 10" />
                                           <span className="text-sm">or more for</span>
                                           <input type="number" value={tier.price || ''} onChange={e => handleTierChange(index, 'price', e.target.value)} className="input w-32" placeholder="e.g., 1400" />
                                           <span className="text-sm">XAF each</span>
                                           <button type="button" onClick={() => removeTier(index)} className="text-red-500 hover:text-red-700">&times;</button>
                                       </div>
                                   ))}
                                   <button type="button" onClick={addTier} className="btn btn-secondary btn-sm">Add Tier</button>
                               </div>
                           )}
                        </div>
                    )}
                    <div className="flex justify-end gap-4 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-light">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : (isEditing ? 'Update Listing' : isVerified ? 'Publish' : 'Submit for Review')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ListingFormPage;