const sizeClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
};

export function SectionContainer({ children, className = "", size = "lg" }) {
  return (
    <div className={`container ${sizeClasses[size]} mx-auto px-6 sm:px-8 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}
