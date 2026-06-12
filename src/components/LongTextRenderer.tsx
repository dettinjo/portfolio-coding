"use client";

import ReactMarkdown from "react-markdown";
import { type ExtraProps } from "react-markdown";
import rehypeRaw from "rehype-raw";

interface LongTextRendererProps {
  content: string | null | undefined;
}

const CodeComponent = ({
  children,
  className,
  ...props
}: React.ClassAttributes<HTMLElement> &
  React.HTMLAttributes<HTMLElement> &
  ExtraProps) => {
  const isInlineCode = !className;
  if (isInlineCode) {
    return (
      <code
        className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
        {...props}
      >
        {children}
      </code>
    );
  }
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

// Inline images. Screenshots get a rounded, shadowed frame; technology SVG
// icons render as a plain centered glyph (no frame).
const ImgComponent = ({
  // node + width/height are intentionally dropped so the README's HTML width
  // attributes don't override the CSS sizing below.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  node,
  width: _width,
  height: _height,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & ExtraProps) => {
  const isIcon = String(props.src || "").toLowerCase().endsWith(".svg");
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={props.alt || ""}
      loading="lazy"
      className={
        isIcon
          ? "m-0 mx-auto h-auto max-h-40 w-auto object-contain"
          : "m-0 h-auto max-h-[460px] w-auto rounded-xl border border-border object-contain shadow-md"
      }
    />
  );
};

// A paragraph that contains only images is rendered as a responsive,
// centered flex grid — so multiple screenshots sit side by side and wrap,
// instead of stacking full-width. Normal paragraphs render as usual.
const ParagraphComponent = ({
  node,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & ExtraProps) => {
  const kids = (node?.children ?? []) as Array<{
    type: string;
    tagName?: string;
    value?: string;
  }>;
  const onlyImages =
    kids.length > 0 &&
    kids.some((c) => c.type === "element" && c.tagName === "img") &&
    kids.every(
      (c) =>
        (c.type === "element" && c.tagName === "img") ||
        (c.type === "text" && !(c.value ?? "").trim())
    );

  if (onlyImages) {
    return (
      <div className="not-prose my-8 flex flex-wrap items-start justify-center gap-4">
        {children}
      </div>
    );
  }
  return <p {...props}>{children}</p>;
};

export function LongTextRenderer({ content }: LongTextRendererProps) {
  if (!content) {
    return null;
  }

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          code: CodeComponent,
          img: ImgComponent,
          p: ParagraphComponent,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
