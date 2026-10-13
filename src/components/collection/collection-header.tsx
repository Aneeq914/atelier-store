type Props = {
  eyebrow: string;
  title: string;
  intro?: string;
};

/** Page heading for collection pages (New arrivals, categories). */
export function CollectionHeader({ eyebrow, title, intro }: Props) {
  return (
    <header className="container-page pt-8 pb-8 lg:pt-12 lg:pb-10">
      <div className="flex max-w-2xl flex-col gap-3">
        <p className="type-caption text-muted">{eyebrow}</p>
        {/* wrap-anywhere: titles can include what a shopper typed, e.g. one long unbroken word. */}
        <h1 className="type-title-xl wrap-anywhere">{title}</h1>
        {intro && <p className="type-body text-pretty text-muted">{intro}</p>}
      </div>
    </header>
  );
}
