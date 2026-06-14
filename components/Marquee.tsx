/* Infinite horizontal text band. Pure CSS animation, server-renderable. */
export function Marquee({
  items,
  outline = false,
  duration = 28,
}: {
  items: string[];
  outline?: boolean;
  duration?: number;
}) {
  const line = items.join("  ·  ") + "  ·  ";
  return (
    <div className={`marquee ${outline ? "marquee--outline" : ""}`} aria-hidden="true">
      <div className="marquee__track" style={{ animationDuration: `${duration}s` }}>
        <span>{line}</span>
        <span>{line}</span>
      </div>
    </div>
  );
}
