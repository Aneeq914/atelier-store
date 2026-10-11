import { services } from "@/lib/sample-data";

export function ServicesStrip() {
  return (
    <section aria-labelledby="services-title" className="section container-page">
      <h2 id="services-title" className="type-title-s mb-8 text-center lg:mb-12">
        The Atelier services
      </h2>
      <ul className="grid gap-x-2 gap-y-8 border-t pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <li key={service.title} className="flex flex-col gap-2">
            <h3 className="type-title-xs">{service.title}</h3>
            <p className="type-caption text-muted">{service.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
