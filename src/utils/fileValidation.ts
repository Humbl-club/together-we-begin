interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateImageFile = (file: File, maxSizeMB: number = 5): Promise<ValidationResult> => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Check file type
  if (!validTypes.includes(file.type)) {
    return Promise.resolve({
      valid: false,
      error: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)'
    });
  }

  // Check file size
  if (file.size > maxSizeBytes) {
    return Promise.resolve({
      valid: false,
      error: `Image must be smaller than ${maxSizeMB}MB`
    });
  }

  // Check dimensions (optional)
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src); // Clean up object URL
      if (img.width > 4096 || img.height > 4096) {
        resolve({
          valid: false,
          error: 'Image dimensions must be less than 4096x4096 pixels'
        });
      } else {
        resolve({ valid: true });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src); // Clean up object URL
      resolve({
        valid: false,
        error: 'Failed to load image'
      });
    };
    img.src = URL.createObjectURL(file);
  });
};

export const validateMultipleImageFiles = async (files: File[], maxSizeMB: number = 5): Promise<{ validFiles: File[]; errors: string[] }> => {
  const validFiles: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const validation = await validateImageFile(file, maxSizeMB);
    if (validation.valid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${validation.error}`);
    }
  }

  return { validFiles, errors };
};