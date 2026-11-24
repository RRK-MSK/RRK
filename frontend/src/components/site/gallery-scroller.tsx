import Image from "next/image";

type GalleryPhoto = {
  src: string;
  alt: string;
};

type GalleryScrollerProps = {
  photos: GalleryPhoto[];
};

const MOSAIC_SIZE = 9;

function chunkPhotos<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function GalleryScroller({ photos }: GalleryScrollerProps) {
  const mosaics = chunkPhotos(photos, MOSAIC_SIZE);

  return (
    <div className="gallery-marquee">
      <div className="gallery-marquee-track">
        {mosaics.map((mosaicPhotos, mosaicIndex) => (
          <div key={`mosaic-${mosaicIndex}`} className="gallery-mosaic">
            {mosaicPhotos.map((photo, photoIndex) => (
              <div key={photo.src} className="gallery-photo">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 767px) 92vw, (max-width: 1100px) 70vw, 560px"
                  quality={65}
                  loading="eager"
                  priority={mosaicIndex === 0 && photoIndex < 2}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}