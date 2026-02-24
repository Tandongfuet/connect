
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mockSubmitVerification } from '../services/mockApi';
import Spinner from './Spinner';

const MAX_IMAGES = 2;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const VerificationForm: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    location: user?.location || '',
    idNumber: user?.nationalIdNumber || '',
    businessNumber: user?.businessRegistrationNumber || '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!user || user.verificationStatus === 'Verified') {
    return null; // Should be handled by the parent component's logic
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
  };

  const processFiles = (filesToProcess: File[]) => {
    if (images.length + filesToProcess.length > MAX_IMAGES) {
      addToast(`You can only upload a maximum of ${MAX_IMAGES} images (front and back of ID).`, 'error');
      return;
    }

    const newImages: string[] = [];
    let allFilesValid = true;

    filesToProcess.forEach(file => {
      const fileSizeMB = file.size / 1024 / 1024;
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        addToast(`Unsupported file type: "${file.name}". Please use JPG or PNG.`, 'error');
        allFilesValid = false;
        return;
      }
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        addToast(`"${file.name}" is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`, 'error');
        allFilesValid = false;
        return;
      }
    });
    
    if (!allFilesValid) return;

    filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
            newImages.push(reader.result as string);
            if (newImages.length === filesToProcess.length) {
                setImages(prev => [...prev, ...newImages]);
            }
        };
        reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length !== 2) {
      addToast('Please upload both the front and back of your National ID card.', 'error');
      return;
    }
    if (!formData.idNumber || !formData.name || !formData.location) {
        addToast('Please fill out all required fields.', 'error');
        return;
    }

    setLoading(true);
    try {
        const updatedUser = await mockSubmitVerification(user.id, {
            name: formData.name,
            location: formData.location,
            idNumber: formData.idNumber,
            businessNumber: formData.businessNumber,
            idImages: images,
        });
        updateUser(updatedUser);
        addToast('Verification documents submitted successfully!', 'success');
    } catch (error: any) {
        addToast(error.message || 'Failed to submit verification.', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <p className="text-gray-muted dark:text-dark-muted mb-6">To ensure the safety and security of our community, we require all sellers to verify their identity. Providing a business registration number will grant you a <span className="font-bold text-slate-500 dark:text-slate-400">Silver</span> verification badge.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className="label">Full Name (as on ID)</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                 <div>
                    <label htmlFor="idNumber" className="label">National ID Number</label>
                    <input type="text" id="idNumber" name="idNumber" value={formData.idNumber} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="location" className="label">Your Location (City/Town)</label>
                    <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g., Bamenda" />
                </div>
                 <div>
                    <label htmlFor="businessNumber" className="label">Business Registration Number (Optional)</label>
                    <input type="text" id="businessNumber" name="businessNumber" value={formData.businessNumber} onChange={handleChange} placeholder="e.g., RC/DLA/2024/A/1234" />
                </div>
            </div>

            <div>
                <label className="label">National ID Card Images (Front & Back)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-olive-light hover:border-primary-light dark:border-dark-border dark:hover:border-primary">
                    <div className="space-y-1 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <label htmlFor="id-upload" className="relative cursor-pointer font-medium text-primary hover:text-primary-dark">
                            <span>Upload files</span>
                            <input id="id-upload" type="file" className="sr-only" multiple accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} disabled={images.length >= MAX_IMAGES} />
                        </label>
                    </div>
                </div>
                 {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        {images.map((image, index) => (
                            <div key={index} className="relative group">
                                <img src={image} alt={`ID preview ${index + 1}`} className="h-32 w-full object-cover rounded-md border" />
                                <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-7 w-7 flex items-center justify-center opacity-0 group-hover:opacity-100" aria-label="Remove image">&times;</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="pt-4 border-t dark:border-dark-border">
                <button type="submit" className="btn btn-primary w-full" disabled={loading || user.verificationStatus === 'Pending'}>
                    {loading ? <Spinner size="sm"/> : (user.verificationStatus === 'Pending' ? 'Submission is Pending Review' : 'Submit for Verification')}
                </button>
            </div>
        </form>
    </div>
  );
};

export default VerificationForm;
