import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Star,
  Plus,
  Link,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { compressImageFile, isValidImageFile } from '../utils/imageUtils';
import { playTapSound, playChimeNotification } from '../utils/sound';

interface ImageUploadDropzoneProps {
  images: string[];
  onChange: (newImages: string[]) => void;
  multiple?: boolean;
  maxImages?: number;
  label?: string;
  description?: string;
  presets?: { name: string; url: string }[];
  helperText?: string;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  images,
  onChange,
  multiple = true,
  maxImages = 6,
  label = 'Product Images',
  description,
  presets,
  helperText,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process files (from drop or file input)
  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(isValidImageFile);

    if (files.length === 0) {
      setErrorMessage('Please select valid image files (JPG, PNG, WebP, etc.)');
      return;
    }

    // Check max image limit
    if (!multiple) {
      // Single mode
      setIsProcessing(true);
      setErrorMessage(null);
      try {
        const compressed = await compressImageFile(files[0], {
          maxWidth: 1000,
          quality: 0.82,
        });
        onChange([compressed.dataUrl]);
        playChimeNotification();
        setSuccessMessage(`Photo uploaded & optimized (${compressed.sizeKb} KB)`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        setErrorMessage('Could not process this image. Please try another one.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Multiple mode
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setErrorMessage(`Maximum ${maxImages} images allowed per product.`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const compressedResults = await Promise.all(
        filesToProcess.map((file) =>
          compressImageFile(file, { maxWidth: 1000, quality: 0.82 })
        )
      );

      const newUrls = compressedResults.map((r) => r.dataUrl);
      onChange([...images, ...newUrls]);
      playChimeNotification();
      setSuccessMessage(
        `Added ${newUrls.length} ${newUrls.length === 1 ? 'image' : 'images'} successfully!`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage('Failed to compress some images. Please retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag & drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  // File input change handler
  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      // Reset input value so same file can be re-selected if deleted
      e.target.value = '';
    }
  };

  // Thumbnail operations
  const handleRemoveImage = (indexToRemove: number) => {
    playTapSound();
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetAsPrimary = (indexToPromote: number) => {
    playTapSound();
    if (indexToPromote === 0) return;
    const item = images[indexToPromote];
    const rest = images.filter((_, idx) => idx !== indexToPromote);
    onChange([item, ...rest]);
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    playTapSound();
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChange(copy);
  };

  // Add via external URL
  const handleAddUrl = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = urlInputValue.trim();
    if (!trimmed) return;

    if (!multiple) {
      onChange([trimmed]);
      setUrlInputValue('');
      setShowUrlInput(false);
      playTapSound();
      return;
    }

    if (images.length >= maxImages) {
      setErrorMessage(`Max ${maxImages} images allowed.`);
      return;
    }

    onChange([...images, trimmed]);
    setUrlInputValue('');
    setShowUrlInput(false);
    playTapSound();
  };

  const handlePickPreset = (presetUrl: string) => {
    playTapSound();
    if (!multiple) {
      onChange([presetUrl]);
      return;
    }
    if (images.includes(presetUrl)) {
      setErrorMessage('This preset is already added.');
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }
    if (images.length >= maxImages) {
      setErrorMessage(`Max ${maxImages} images allowed.`);
      return;
    }
    onChange([...images, presetUrl]);
  };

  return (
    <div className="space-y-2.5">
      {/* Label and counter header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-['Outfit']">
            <span>{label}</span>
            {multiple && (
              <span className="text-[10px] font-semibold bg-[#516B84]/15 text-[#516B84] px-1.5 py-0.2 rounded-full">
                {images.length} / {maxImages} {images.length === 1 ? 'photo' : 'photos'}
              </span>
            )}
          </label>
          {description && (
            <p className="text-[11px] text-slate-500">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setShowUrlInput((prev) => !prev);
            }}
            className="text-[11px] font-medium text-[#516B84] hover:underline flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
          >
            <Link className="w-3 h-3" />
            <span>{showUrlInput ? 'Hide URL' : 'Paste URL'}</span>
          </button>
        </div>
      </div>

      {/* URL Input Form (if toggled) */}
      {showUrlInput && (
        <div
          className="flex items-center gap-2 p-2 bg-[#F7F7F6] border border-[#d8d6d3] rounded-xl animate-fadeIn text-xs"
        >
          <input
            type="url"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleAddUrl(e);
              }
            }}
            placeholder="Paste direct image link (e.g. https://...)"
            className="flex-1 bg-white border border-[#d8d6d3] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#516B84]"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInputValue.trim()}
            className="px-3 py-1.5 bg-[#516B84] text-white font-semibold rounded-lg hover:bg-[#3E5367] disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
          >
            Add Image
          </button>
        </div>
      )}

      {/* Drag and Drop Zone Box */}
      <div
        id="image-dropzone-area"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isProcessing && (multiple ? images.length < maxImages : true)) {
            fileInputRef.current?.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-2 ${
          isDragging
            ? 'border-[#516B84] bg-[#516B84]/10 scale-[1.01] shadow-md ring-2 ring-[#516B84]/30'
            : 'border-[#d8d6d3] bg-[#F7F7F6]/80 hover:bg-[#F7F7F6] hover:border-[#516B84]/60'
        } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
            <Loader2 className="w-7 h-7 text-[#516B84] animate-spin" />
            <span className="text-xs font-semibold text-slate-700">
              Optimizing & compressing image...
            </span>
            <span className="text-[10px] text-slate-500">
              Generating clean, fast-loading photo
            </span>
          </div>
        ) : (
          <>
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all shadow-xs ${
                isDragging
                  ? 'bg-[#516B84] text-white scale-110'
                  : 'bg-white text-[#516B84] border border-[#d8d6d3]'
              }`}
            >
              <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-bold text-slate-800 font-['Outfit']">
                {isDragging
                  ? 'Drop images here!'
                  : multiple
                  ? 'Drag & drop multiple photos here'
                  : 'Drag & drop image here'}
              </p>
              <p className="text-[11px] text-slate-500">
                or <span className="text-[#516B84] font-semibold underline">browse from phone / PC</span> (JPEG, PNG, WebP)
              </p>
            </div>

            {multiple && (
              <span className="text-[10px] text-slate-400 font-medium">
                Tip: You can select multiple photos at once. Click ⭐ on any photo to make it the main menu thumbnail.
              </span>
            )}
          </>
        )}
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Uploaded Thumbnails Grid with Gallery Management */}
      {images.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-0.5">
            <span>Uploaded Photos ({images.length}):</span>
            <span className="text-[10px] text-slate-400">First image is the primary cover</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {images.map((imgUrl, index) => {
              const isPrimary = index === 0;

              return (
                <div
                  key={`${imgUrl.substring(0, 30)}-${index}`}
                  className={`group relative aspect-4/3 rounded-xl overflow-hidden border bg-slate-100 shadow-xs transition-all ${
                    isPrimary
                      ? 'border-[#516B84] ring-2 ring-[#516B84]/30'
                      : 'border-[#d8d6d3] hover:border-slate-400'
                  }`}
                >
                  {/* Photo Preview */}
                  <img
                    src={imgUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Primary Badge */}
                  {isPrimary ? (
                    <div className="absolute top-1.5 left-1.5 bg-[#516B84] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                      <span>Primary</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetAsPrimary(index)}
                      className="absolute top-1.5 left-1.5 bg-black/60 hover:bg-[#516B84] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md shadow-xs transition-colors flex items-center gap-0.5 opacity-0 group-hover:opacity-100 sm:opacity-100"
                      title="Set this image as primary thumbnail"
                    >
                      <Star className="w-2.5 h-2.5" />
                      <span>Make Primary</span>
                    </button>
                  )}

                  {/* Action Bar Overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1 flex items-center justify-between gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    {/* Reorder Arrows */}
                    <div className="flex items-center gap-0.5">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'left')}
                          className="p-1 rounded bg-white/20 hover:bg-white/40 text-white text-[10px]"
                          title="Move left"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                      )}
                      {index < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'right')}
                          className="p-1 rounded bg-white/20 hover:bg-white/40 text-white text-[10px]"
                          title="Move right"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Delete Photo Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-1 rounded bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                      title="Remove this photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick Add More Tile if multiple and not at limit */}
            {multiple && images.length < maxImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-4/3 rounded-xl border-2 border-dashed border-[#d8d6d3] hover:border-[#516B84] hover:bg-white text-slate-500 hover:text-[#516B84] flex flex-col items-center justify-center gap-1 transition-colors text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[10px]">Add More</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preset Library Suggestions */}
      {presets && presets.length > 0 && (
        <div className="pt-1.5">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
            Or pick from food presets:
          </span>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePickPreset(p.url)}
                className="px-2 py-1 bg-white border border-[#d8d6d3] hover:border-[#516B84] text-[10px] font-medium text-slate-700 rounded-lg whitespace-nowrap shadow-2xs hover:bg-slate-50 transition-colors flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-2.5 h-2.5 text-[#516B84]" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {helperText && (
        <p className="text-[10px] text-slate-400 italic">{helperText}</p>
      )}
    </div>
  );
};
