/**
 * Optimizes an uploaded image file (PNG, JPG, WEBP) by downscaling dimensions
 * if larger than maxDim (default: 850px) and compressing to lightweight JPEG (default quality 0.72).
 * 
 * This ensures:
 * 1. Ultra-fast, instant upload without any network payload lag or timeout.
 * 2. Instant client-side preview in Admin and My Tickets modals.
 * 3. Prevention of localStorage 5MB quota errors.
 * 4. High visual clarity for inspecting UPI reference numbers, timestamps, and rupee amounts.
 */
export async function optimizeImageForUpload(
  file: File,
  maxDim = 850,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Uploaded file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image in browser'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale while maintaining aspect ratio
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
