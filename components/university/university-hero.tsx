/**
 * Hero banner for a real, licensed campus photo. Renders nothing when there's
 * no image. Uses a plain <img> (not next/image) so external hosts like
 * Wikimedia need no next.config remotePatterns entry. Attribution is shown as
 * a caption — required for Wikimedia Commons / Creative Commons images.
 */
export function UniversityHero({
  imageUrl,
  credit,
  sourceUrl,
  alt,
}: {
  imageUrl: string | null | undefined;
  credit?: string | null;
  sourceUrl?: string | null;
  alt: string;
}) {
  if (!imageUrl) return null;
  return (
    <figure className="relative mb-8 mt-6 overflow-hidden rounded-2xl border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        className="h-44 w-full object-cover sm:h-60"
      />
      {credit ? (
        <figcaption className="absolute bottom-0 right-0 max-w-[70%] truncate rounded-tl-lg bg-black/50 px-2 py-0.5 text-[10px] text-white/90 backdrop-blur-sm">
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:underline"
            >
              {credit}
            </a>
          ) : (
            credit
          )}
        </figcaption>
      ) : null}
    </figure>
  );
}
