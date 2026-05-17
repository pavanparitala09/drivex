export const getResourceType = (mimeType) => {
  if (!mimeType) return 'raw';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw';
};
