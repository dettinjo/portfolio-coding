import { ResumeItem } from "@/types/resume";

interface Props {
  item: ResumeItem;
  type: "work" | "education";
}

export function ResumeEntry({ item, type }: Props) {
  if (!item.visible) return null;

  const title = type === "work" ? item.position : item.studyType;
  const organization = type === "work" ? item.company : item.institution;
  
  // For education, area is shown as description
  const description = type === "education" ? item.area : null;

  return (
    <div className="flex flex-col gap-0 break-inside-avoid">
      {item.date && (
        <div>
          <span className="text-sm opacity-60 font-mono">
            {item.date}
          </span>
        </div>
      )}
      <div>
        <h3 className="font-bold text-lg leading-tight">
          {item.url?.href ? (
            <a
              href={item.url.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {organization}
            </a>
          ) : (
            organization
          )}
        </h3>
      </div>
      <div>
        <span className="font-semibold opacity-80 leading-tight">{title}</span>
      </div>

      {/* Education Area (Description style) */}
      {description && (
        <div className="text-sm opacity-70 leading-relaxed">
          {description}
        </div>
      )}

      {/* Render HTML content safely since your JSON contains <p> tags */}
      {item.summary && (
        <div
          className="text-sm opacity-70 leading-relaxed [&>p]:mb-0 [&_em]:not-italic"
          dangerouslySetInnerHTML={{ __html: item.summary }}
        />
      )}
    </div>
  );
}
