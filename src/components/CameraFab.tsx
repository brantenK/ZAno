import React, { useRef } from 'react';
import { Camera } from 'lucide-react';

interface CameraFabProps {
    onCapture: (file: File) => void;
    disabled?: boolean;
}

const CameraFab: React.FC<CameraFabProps> = ({ onCapture, disabled }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onCapture(file);
        }
        // Reset input so same file can be selected again if needed
        if (event.target.value) {
            event.target.value = '';
        }
    };

    return (
        <div className="md:hidden fixed bottom-24 right-6 z-30 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-500">
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment" // Forces rear camera on mobile
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled}
            />
            <button
                onClick={handleClick}
                disabled={disabled}
                aria-label="Take photo of receipt or invoice"
                className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Camera className="w-7 h-7" />
            </button>
        </div>
    );
};

export default CameraFab;
