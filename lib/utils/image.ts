/**
 * Converts a Supabase Storage URL to use the image transformation endpoint.
 * Non-Supabase URLs are returned as-is.
 *
 * @param url    Original storage URL
 * @param width  Max width in pixels
 * @param quality JPEG quality 1-100 (default 80)
 */
export function getImageUrl(url: string, width: number, quality = 80): string {
  if (!url || !url.includes("/storage/v1/object/public/")) return url;
  return url
    .replace("/storage/v1/object/public/", "/storage/v1/render/image/public/")
    .concat(`?width=${width}&quality=${quality}&resize=contain`);
}
