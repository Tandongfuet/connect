
import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';

interface ImageCropperModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string | null;
    onSave: (croppedImageUrl: string) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}


const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ isOpen, onClose, imageSrc, onSave }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [aspect, setAspect] = useState<number | undefined>(1 / 1);

    if (!isOpen || !imageSrc) return null;
    
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        if (aspect) {
          const { width, height } = e.currentTarget;
          setCrop(centerAspectCrop(width, height, aspect));
        }
    };

    const handleSave = () => {
        if (!completedCrop || !imgRef.current) {
            return;
        }

        const canvas = document.createElement('canvas');
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
        
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(
            imgRef.current,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width,
            completedCrop.height
        );
        
        const base64Image = canvas.toDataURL('image/jpeg');
        onSave(base64Image);
    };

    const AspectButton: React.FC<{ value: number | undefined, label: string }> = ({ value, label }) => (
        <button
            onClick={() => setAspect(value)}
            className={`btn btn-sm ${aspect === value ? 'btn-primary' : 'btn-secondary'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-4">Crop Your Image</h2>
                
                <div className="flex justify-center mb-4 gap-2">
                    <AspectButton value={1 / 1} label="Square (1:1)" />
                    <AspectButton value={16 / 9} label="Landscape (16:9)" />
                    <AspectButton value={undefined} label="Free" />
                </div>
                
                <div className="relative" style={{ maxHeight: '60vh' }}>
                    <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        onComplete={c => setCompletedCrop(c)}
                        aspect={aspect}
                    >
                        <img
                            ref={imgRef}
                            alt="Crop preview"
                            src={imageSrc}
                            onLoad={onImageLoad}
                            style={{ maxHeight: '60vh', objectFit: 'contain' }}
                        />
                    </ReactCrop>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="btn btn-light">Cancel</button>
                    <button type="button" onClick={handleSave} className="btn btn-primary" disabled={!completedCrop}>Crop & Save</button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropperModal;
