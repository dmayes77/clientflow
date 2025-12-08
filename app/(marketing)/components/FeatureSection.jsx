import { SectionContainer } from "./SectionContainer";

// Map icon text colors to gradient and accent colors
const colorMap = {
  "text-primary": {
    gradient: "from-primary/20 via-primary/10 to-transparent",
    iconGradient: "from-primary to-blue-600",
    title: "text-primary",
    bullet: "bg-primary",
    bgIcon: "text-primary/5",
  },
  "text-green-600": {
    gradient: "from-green-500/20 via-green-500/10 to-transparent",
    iconGradient: "from-green-500 to-emerald-600",
    title: "text-green-600",
    bullet: "bg-green-500",
    bgIcon: "text-green-500/5",
  },
  "text-violet-600": {
    gradient: "from-violet-500/20 via-violet-500/10 to-transparent",
    iconGradient: "from-violet-500 to-purple-600",
    title: "text-violet-600",
    bullet: "bg-violet-500",
    bgIcon: "text-violet-500/5",
  },
  "text-pink-600": {
    gradient: "from-pink-500/20 via-pink-500/10 to-transparent",
    iconGradient: "from-pink-500 to-rose-600",
    title: "text-pink-600",
    bullet: "bg-pink-500",
    bgIcon: "text-pink-500/5",
  },
  "text-teal-600": {
    gradient: "from-teal-500/20 via-teal-500/10 to-transparent",
    iconGradient: "from-teal-500 to-cyan-600",
    title: "text-teal-600",
    bullet: "bg-teal-500",
    bgIcon: "text-teal-500/5",
  },
  "text-indigo-600": {
    gradient: "from-indigo-500/20 via-indigo-500/10 to-transparent",
    iconGradient: "from-indigo-500 to-blue-600",
    title: "text-indigo-600",
    bullet: "bg-indigo-500",
    bgIcon: "text-indigo-500/5",
  },
  "text-orange-600": {
    gradient: "from-orange-500/20 via-orange-500/10 to-transparent",
    iconGradient: "from-orange-500 to-amber-600",
    title: "text-orange-600",
    bullet: "bg-orange-500",
    bgIcon: "text-orange-500/5",
  },
};

export function FeatureSection({
  id,
  icon: Icon,
  iconColor,
  title,
  description,
  features,
  cardTitle,
  cardItems,
  reversed = false,
  bgMuted = false,
}) {
  const colors = colorMap[iconColor] || colorMap["text-primary"];

  return (
    <section id={id} className={`py-16 md:py-20 relative overflow-hidden ${bgMuted ? "bg-muted/50" : ""}`}>
      {/* Large background icon - positioned opposite to card */}
      <Icon className={`absolute -bottom-8 ${reversed ? "-right-8" : "-left-8"} h-64 w-64 ${colors.bgIcon} pointer-events-none select-none`} />

      <SectionContainer>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch ${reversed ? "md:[&>*:first-child]:order-2" : ""}`}>
          {/* Left side - Text content */}
          <div className="flex flex-col justify-center">
            <h2 className={`mft-h2 mb-3 ${colors.title}`}>{title}</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">{description}</p>

            {/* Feature highlights */}
            <div className="space-y-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-2 h-1.5 w-1.5 rounded-full ${colors.bullet} shrink-0`} />
                  <div>
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Feature card */}
          <div className="relative group">
            {/* Card container */}
            <div className="relative h-full overflow-hidden rounded-2xl border bg-background shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
              {/* Gradient header with icon */}
              <div className={`relative h-20 bg-linear-to-br ${colors.gradient}`}>
                {/* Floating icon */}
                <div className={`absolute -bottom-5 left-6 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br ${colors.iconGradient} text-white shadow-lg`}>
                  <Icon className="h-7 w-7" />
                </div>
              </div>

              {/* Card content */}
              <div className="px-6 pt-10 pb-6 relative">
                <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-4">
                  {cardTitle}
                </p>
                <ul className="space-y-3">
                  {cardItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className={`mt-2 h-1.5 w-1.5 rounded-full ${colors.bullet} shrink-0`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
