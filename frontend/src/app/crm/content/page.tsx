export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/crm/ui";
import { SiteContentEditor } from "@/components/crm/site-content-editor";
import { getSiteMediaItems } from "@/lib/site-media";

export default async function ContentPage() {
  const [heroItems, galleryItems] = await Promise.all([
    getSiteMediaItems("hero"),
    getSiteMediaItems("gallery"),
  ]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Сайт · Медиа"
        title="Контент"
        description="Фото и видео для шапки главной страницы и мозаики «Атмосфера». Файлы сжимаются при загрузке, чтобы сайт не тормозил."
      />

      <SiteContentEditor
        section="hero"
        title="Шапка"
        description="Слайды фона: фото или короткое видео. Порядок сверху вниз — порядок на сайте."
        items={heroItems}
        allowVideo
      />

      <SiteContentEditor
        section="gallery"
        title="Галерея"
        description="Фото для блока «Атмосфера». Лучше горизонтальные кадры встреч."
        items={galleryItems}
      />
    </div>
  );
}
