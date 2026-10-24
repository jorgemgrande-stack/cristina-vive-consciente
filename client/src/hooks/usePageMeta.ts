import { useEffect } from "react";

/**
 * Pone el <title> y la meta description de la página mientras está montada y deja los
 * anteriores al salir. Con `null` no toca nada (p. ej. mientras cargan los datos).
 */
export function usePageMeta(meta: { title: string; description: string } | null) {
  const title = meta?.title;
  const description = meta?.description;

  useEffect(() => {
    if (!title || !description) return;
    const tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevTitle = document.title;
    const prevDescription = tag?.content;
    document.title = title;
    if (tag) tag.content = description;
    return () => {
      document.title = prevTitle;
      if (tag && prevDescription !== undefined) tag.content = prevDescription;
    };
  }, [title, description]);
}
