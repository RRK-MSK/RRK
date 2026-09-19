"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteSiteMedia, reorderSiteMedia, uploadSiteMedia } from "@/app/crm/actions";
import type { SiteMediaItem, SiteMediaSection } from "@/lib/site-media-types";

type SiteContentEditorProps = {
  section: SiteMediaSection;
  title: string;
  description: string;
  items: SiteMediaItem[];
  allowVideo?: boolean;
};

export function SiteContentEditor({
  section,
  title,
  description,
  items,
  allowVideo = false,
}: SiteContentEditorProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("section", section);
    setIsUploading(true);

    try {
      await uploadSiteMedia(data);
      form.reset();
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось загрузить файлы");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Удалить этот файл с сайта?")) {
      return;
    }

    setBusyId(id);
    try {
      await deleteSiteMedia(id);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось удалить файл");
    } finally {
      setBusyId(null);
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    setBusyId(id);
    try {
      await reorderSiteMedia(id, direction);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось изменить порядок");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="section-block">
      <div className="section-header-row">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="section-counter">{items.length}</span>
      </div>

      <form className="crm-content-upload" onSubmit={handleUpload}>
        <input
          type="file"
          name="files"
          multiple
          accept={allowVideo ? "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif"}
          required
        />
        {allowVideo ? (
          <label className="crm-content-poster">
            Постер для видео (необязательно)
            <input type="file" name="poster" accept="image/jpeg,image/png,image/webp" />
          </label>
        ) : null}
        <button type="submit" className="primary-button" disabled={isUploading}>
          {isUploading ? "Загрузка..." : "Добавить"}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="crm-content-empty">Пока пусто. На сайте останутся текущие файлы из приложения, пока вы ничего не загрузите.</p>
      ) : (
        <div className="crm-content-grid">
          {items.map((item, index) => (
            <article key={item.id} className="crm-content-card">
              <div className="crm-content-preview">
                {item.mediaType === "video" ? (
                  <video src={item.src} poster={item.poster} muted playsInline />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.src} alt="" />
                )}
                <span>{item.mediaType === "video" ? "Видео" : "Фото"}</span>
              </div>
              <div className="crm-content-actions">
                <button
                  type="button"
                  className="ghost-button"
                  disabled={busyId === item.id || index === 0}
                  onClick={() => handleReorder(item.id, "up")}
                >
                  Вверх
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  disabled={busyId === item.id || index === items.length - 1}
                  onClick={() => handleReorder(item.id, "down")}
                >
                  Вниз
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  disabled={busyId === item.id}
                  onClick={() => handleDelete(item.id)}
                >
                  Удалить
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
