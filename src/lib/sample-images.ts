// Sample photography from Pexels (free to use under the Pexels license), saved
// in public/images/sample so pages do not depend on a third-party server.

export type SampleImage = {
  src: string;
  alt: string;
  /** CSS object-position, used when the frame crops the photo. */
  position?: string;
  /** Source page, for attribution. */
  credit?: string;
};

export function photo(file: string, pexelsId: number, alt: string, position?: string): SampleImage {
  return {
    src: `/images/sample/${file}.jpg`,
    alt,
    position,
    credit: `https://www.pexels.com/photo/${pexelsId}/`,
  };
}
