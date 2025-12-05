import { EndpointCard } from "./EndpointCard";

export function APISection({ id, title, description, endpoints }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-3">
        <h2 className="et-text-base font-semibold text-zinc-900 mb-1">{title}</h2>
        {description && (
          <p className="et-text-sm text-zinc-500">{description}</p>
        )}
      </div>
      <div className="space-y-2">
        {endpoints.map((endpoint, idx) => (
          <EndpointCard key={idx} {...endpoint} />
        ))}
      </div>
    </section>
  );
}
