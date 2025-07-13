// utils/getDirectDriveImageUrl.ts
export function getDirectDriveImageUrl(driveUrl: string): string {
  const match = driveUrl.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
  return match ? `https://drive.google.com/uc?export=view&id=${match[1]}` : driveUrl;
}
