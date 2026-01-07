
import React, { useRef, useEffect } from 'react';
import { CheckCircle, Eraser } from 'lucide-react';

interface SignaturePadProps {
    value: string;
    onChange: (dataUrl: string) => void;
    label: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ value, onChange, label }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);

    useEffect(() => {
        if (value) return; 

        const canvas = canvasRef.current;
        if (!canvas) return;

        const initCanvas = () => {
            if(!canvas) return;
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const rect = canvas.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                canvas.width = rect.width * ratio;
                canvas.height = rect.height * ratio;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.scale(ratio, ratio);
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                }
            }
        };

        const getPos = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = (e as MouseEvent).clientX;
                clientY = (e as MouseEvent).clientY;
            }
            return { x: clientX - rect.left, y: clientY - rect.top };
        };

        const start = (e: MouseEvent | TouchEvent) => {
            if(e.cancelable) e.preventDefault();
            isDrawingRef.current = true;
            const pos = getPos(e);
            const ctx = canvas.getContext('2d');
            ctx?.beginPath();
            ctx?.moveTo(pos.x, pos.y);
        };

        const move = (e: MouseEvent | TouchEvent) => {
            if(e.cancelable) e.preventDefault();
            if (!isDrawingRef.current) return;
            const pos = getPos(e);
            const ctx = canvas.getContext('2d');
            ctx?.lineTo(pos.x, pos.y);
            ctx?.stroke();
        };

        const stop = (e: MouseEvent | TouchEvent) => {
            if(e.cancelable) e.preventDefault();
            if (isDrawingRef.current) {
                isDrawingRef.current = false;
                onChange(canvas.toDataURL("image/png"));
            }
        };

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        canvas.addEventListener('mouseup', stop);
        canvas.addEventListener('mouseleave', stop);
        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', stop);

        initCanvas();
        const t = setTimeout(initCanvas, 200);
        const handleResize = () => initCanvas();
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(t);
            window.removeEventListener('resize', handleResize);
            if (canvas) {
                canvas.removeEventListener('mousedown', start);
                canvas.removeEventListener('mousemove', move);
                canvas.removeEventListener('mouseup', stop);
                canvas.removeEventListener('mouseleave', stop);
                canvas.removeEventListener('touchstart', start);
                canvas.removeEventListener('touchmove', move);
                canvas.removeEventListener('touchend', stop);
            }
        };
    }, [value]); 

    if (value) {
        return (
            <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">{label}</span>
                    <span className="text-xs text-green-600 font-bold flex items-center"><CheckCircle size={12} className="mr-1"/> Firmato</span>
                </div>
                <div className="border-2 border-solid border-green-500 bg-green-50 dark:bg-green-900/10 rounded h-32 w-full flex items-center justify-center relative overflow-hidden group">
                     <img src={value} alt="Firma" className="max-h-full max-w-full object-contain p-2" />
                     <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button onClick={() => onChange("")} className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm shadow-lg font-bold hover:bg-red-50 flex items-center">
                            <Eraser size={16} className="mr-2"/> Rifirma
                         </button>
                     </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">{label}</span>
                <button onClick={() => { const c = canvasRef.current; const ctx = c?.getContext('2d'); ctx?.clearRect(0,0,c!.width,c!.height); }} className="text-xs text-red-500 flex items-center hover:underline">
                    <Eraser size={12} className="mr-1"/> Pulisci
                </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded bg-white touch-none overflow-hidden relative h-32 w-full shadow-inner">
                <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
            </div>
        </div>
    );
};
