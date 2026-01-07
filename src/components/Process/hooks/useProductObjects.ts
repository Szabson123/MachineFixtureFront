import { useEffect, useState, useRef } from "react";

export function useProductObjects(initialUrl: string, ordering: string) {
  const [objects, setObjects] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchObjects = async (url: string, append = false) => {
    try {
      const parsed = new URL(url, window.location.origin);

      if (ordering) {
        parsed.searchParams.set("ordering", ordering);
      }

      const relativeUrl = parsed.pathname + parsed.search;

      const res = await fetch(relativeUrl);
      const data = await res.json();

      setObjects((prev) => (append ? [...prev, ...data.results] : data.results));

      if (data.next) {
        const nextParsed = new URL(data.next, window.location.origin);
        setNextPageUrl(nextParsed.pathname + nextParsed.search);
      } else {
        setNextPageUrl(null);
      }

      setTotalCount(data.count);
    } catch (err) {
      console.error("Błąd ładowania danych:", err);
    }
  };

  useEffect(() => {
    fetchObjects(initialUrl);
  }, [initialUrl, ordering]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && nextPageUrl) {
          fetchObjects(nextPageUrl, true);
        }
      },
      { rootMargin: "100px" }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [nextPageUrl]);

  return {
    objects,
    totalCount,
    loaderRef,
    refetch: () => fetchObjects(initialUrl),
  };
}
