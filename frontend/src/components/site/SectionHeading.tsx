import type { ReactNode } from "react";

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  action,
}: {
  index?: string;
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="eyebrow">
          {index && <span className="mr-2 text-silver-500">{index}</span>}
          {eyebrow}
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-silver-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
