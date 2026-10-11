import type { ReactNode } from "react";
import { PlusIcon } from "@/components/icons";

type Section = { title: string; content: ReactNode; open?: boolean };

/** Native <details> disclosure list: works without JavaScript. */
export function ProductAccordion({ sections }: { sections: Section[] }) {
  return (
    <div className="border-b">
      {sections.map((section) => (
        <details key={section.title} open={section.open} className="group border-t">
          <summary className="type-title-xs flex cursor-pointer list-none items-center justify-between py-5 [&::-webkit-details-marker]:hidden">
            {section.title}
            <PlusIcon
              width={16}
              height={16}
              className="transition-transform duration-300 ease-luxe group-open:rotate-45"
            />
          </summary>
          <div className="pb-6">{section.content}</div>
        </details>
      ))}
    </div>
  );
}
