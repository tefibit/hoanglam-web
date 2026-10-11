import Link from "next/link";

interface PageHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  // Breadcrumb trail after "Trang chủ"; the last item is the current page.
  trail: { label: string; href?: string }[];
}

export function PageHeading({ eyebrow, title, description, trail }: PageHeadingProps) {
  return (
    <div className="page-heading">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link>
        {trail.map((item) => (
          <span key={item.label}>
            <span aria-hidden> / </span>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </span>
        ))}
      </nav>
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
