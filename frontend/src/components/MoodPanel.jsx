export default function MoodPanel({
  color,
  eyebrow,
  title,
  titleAs = "h1",
  subline,
  children,
}) {
  const Heading = titleAs === "h2" ? "h2" : "h1";

  return (
    <section className="panel" style={{ "--c": color }}>
      {eyebrow && <p className="panel-eyebrow">{eyebrow}</p>}
      <Heading className="panel-title">{title}</Heading>
      {subline && <p className="panel-sub">{subline}</p>}
      {children}
    </section>
  );
}
