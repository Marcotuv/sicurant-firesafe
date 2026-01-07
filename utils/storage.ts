
import { supabase } from '../config/supabase';

// Helper per comprimere le immagini lato client
export const compressImage = async (file: File, maxWidth = 1024, quality = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Compressione fallita"));
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

// Helper per upload su Supabase
export const uploadPhoto = async (file: File, bucket = 'intervention-photos'): Promise<string | null> => {
    if (!supabase) {
        console.warn("Supabase client not initialized. Cannot upload photo.");
        return null;
    }

    try {
        const compressedBlob = await compressImage(file);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, compressedBlob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error("Upload error:", error);
            return null;
        }

        const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return publicData.publicUrl;
    } catch (err) {
        console.error("Error processing photo:", err);
        return null;
    }
};
