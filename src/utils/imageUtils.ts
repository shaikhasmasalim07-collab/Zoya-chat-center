/**
 * Client-side image utility for resizing and compressing photos before uploading
 * Converts files (JPEG, PNG, WebP, HEIC, GIF) to optimized WebP/JPEG data URLs
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/jpeg' | 'image/webp';
}

/**
 * Resizes and compresses an image file to a lightweight data URL
 */
export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<{ dataUrl: string; sizeKb: number; originalSizeKb: number }> {
  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.82,
    format = 'image/jpeg',
  } = options;

  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Failed to parse image data'));
      };

      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Maintain aspect ratio while scaling within max bounds
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to raw dataURL if canvas fails
            resolve({
              dataUrl: e.target?.result as string,
              sizeKb: originalSizeKb,
              originalSizeKb,
            });
            return;
          }

          // Use high-quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed image
          const compressedDataUrl = canvas.toDataURL(format, quality);
          const approximateSizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

          resolve({
            dataUrl: compressedDataUrl,
            sizeKb: approximateSizeKb,
            originalSizeKb,
          });
        } catch (err) {
          // In case canvas export is constrained, fallback to reader result
          resolve({
            dataUrl: e.target?.result as string,
            sizeKb: originalSizeKb,
            originalSizeKb,
          });
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validates if a file is a supported image
 */
export function isValidImageFile(file: File): boolean {
  return (
    file.type.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(file.name)
  );
}
