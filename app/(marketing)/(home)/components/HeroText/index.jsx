export function HeroText({ title, highlight, description, children }) {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="container mx-auto px-4 text-center relative">
        <h1 className="mft-display-2">
          {title}{" "}
          {highlight && (
            <span className="bg-linear-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent">{highlight}</span>
          )}
        </h1>

        {description && (
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {description}
          </p>
        )}

        {children && (
          <div className="mt-10 flex justify-center">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
