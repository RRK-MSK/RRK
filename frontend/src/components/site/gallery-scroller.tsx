import Image from "next/image";

type GalleryPhoto = {
  src: string;
  alt: string;
};

type GalleryScrollerProps = {
  photos: GalleryPhoto[];
};

const COPY_COUNT = 4;

export function GalleryScroller({ photos }: GalleryScrollerProps) {
  return (
    <div className="gallery-marquee">
      <div className="gallery-marquee-track">
        {Array.from({ length: COPY_COUNT }, (_, copyIndex) => (
          <div key={copyIndex} className="gallery-mosaic">
            {photos.map((photo, index) => (
              <div key={`${copyIndex}-${photo.src}`} className="gallery-photo">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 767px) 50vw, (max-width: 1100px) 40vw, 28vw"
                  quality={65}
                  priority={copyIndex === 0 && index < 3}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
