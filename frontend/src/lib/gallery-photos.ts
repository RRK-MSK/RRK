/**
 * Локальная галерея «РРК и РРКашники»: public/carousel + три закреплённых кадра.
 * Первая — photo_2026-09-10_21-48-38.jpg.
 */
const galleryLeadImage = "/carousel/photo_2026-09-10_21-48-38.jpg";

const carouselFolderImages = [
  "/carousel/IMG_2414.JPG",
  "/carousel/IMG_2415.JPG",
  "/carousel/IMG_4233.JPG",
  "/carousel/IMG_4241.JPG",
  "/carousel/IMG_4456.JPG",
  "/carousel/IMG_5154.JPG",
  "/carousel/IMG_5159.JPG",
  "/carousel/IMG_5259.JPG",
  "/carousel/IMG_6700.JPG",
  "/carousel/IMG_7203.JPG",
  "/carousel/IMG_7205.JPG",
  "/carousel/IMG_7206.JPG",
  "/carousel/IMG_7207.JPG",
  "/carousel/photo_2026-03-25_23-06-35.jpg",
  "/carousel/photo_2026-07-03_18-26-16.jpg",
  "/carousel/photo_2026-07-17_14-57-00.jpg",
  "/carousel/photo_2026-07-17_14-57-01.jpg",
  "/carousel/photo_2026-08-08_13-18-46.jpg",
  "/carousel/photo_2026-08-12_23-39-23.jpg",
  "/carousel/photo_2026-08-24_09-43-45.jpg",
  "/carousel/photo_2026-08-26_21-02-39.jpg",
  "/carousel/photo_2026-09-10_21-48-37.jpg",
  "/carousel/photo_2026-09-10_21-48-38 (2).jpg",
  "/carousel/photo_2026-09-11_18-08-39.jpg",
  "/carousel/photo_2026-11-04_17-27-41.jpg",
] as const;

const legacyGalleryImages = ["/RRK-0003.jpg"] as const;

const galleryImageSources = [galleryLeadImage, ...carouselFolderImages, ...legacyGalleryImages];

export const defaultGalleryPhotos = galleryImageSources.map((src) => ({
  src,
  alt: "Встреча РРК",
}));