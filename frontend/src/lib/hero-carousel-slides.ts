/**
 * Fallback-слайды шапки, если в CRM ещё нет контента.
 * Боевой список редактируется в /crm/content.
 */
export type HeroCarouselSlide = {
  id: string;
  type: "image" | "video";
  src: string;
  poster?: string;
  title?: string;
  description?: string;
  sortOrder?: number;
};

export const defaultHeroCarouselSlides: HeroCarouselSlide[] = [
  {
    id: "jam-vlas",
    type: "image",
    src: "/jam_vlas.jpg",
    sortOrder: 1,
  },
  {
    id: "jam-vlas-2",
    type: "image",
    src: "/jam_vlas_2.jpg",
    sortOrder: 2,
  },
  {
    id: "meeting-video",
    type: "video",
    src: "/встреча.mp4",
    poster: "/session.jpg",
    title: "Живая атмосфера",
    description: "Круг людей, в котором речь становится свободнее, а контакт сильнее.",
    sortOrder: 3,
  },
  {
    id: "rrk-0001",
    type: "image",
    src: "/RRK-0001.jpg",
    title: "РРК в деле",
    description: "Живые встречи, практика и сильное окружение.",
    sortOrder: 4,
  },
  {
    id: "rrk-0002",
    type: "image",
    src: "/RRK-0002.jpg",
    sortOrder: 5,
  },
  {
    id: "rrk-0003",
    type: "image",
    src: "/RRK-0003.jpg",
    sortOrder: 6,
  },
  {
    id: "rrk-0005",
    type: "image",
    src: "/RRK-0005.jpg",
    sortOrder: 7,
  },
  {
    id: "img-0030",
    type: "image",
    src: "/IMG_0030.JPG",
    sortOrder: 8,
  },
  {
    id: "img-0032",
    type: "image",
    src: "/IMG_0032.JPG",
    sortOrder: 9,
  },
  {
    id: "img-0034",
    type: "image",
    src: "/IMG_0034.JPG",
    sortOrder: 10,
  },
  {
    id: "img-0309",
    type: "image",
    src: "/IMG_0309.JPG",
    sortOrder: 11,
  },
  {
    id: "img-0310",
    type: "image",
    src: "/IMG_0310.JPG",
    sortOrder: 12,
  },
];
