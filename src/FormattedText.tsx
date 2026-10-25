import { reportInline, reportParagraphs } from "./reportTypography";
export function FormattedText({ value }: { value: string }) {
  const inline = (value: string) =>
    reportInline(value).map((run, index) => {
      const text = run.italic ? <em>{run.text}</em> : run.text;
      return run.bold ? (
        <strong key={index}>{text}</strong>
      ) : (
        <span key={index}>{text}</span>
      );
    });
  return (
    <div className="formatted-text">
      {reportParagraphs(value).map((block, index) => {
        if (block.kind === "rule") return <hr key={index} />;
        if (block.kind === "heading")
          return block.level === 1 ? (
            <h2 key={index}>{inline(block.text)}</h2>
          ) : (
            <h3 key={index}>{inline(block.text)}</h3>
          );
        if (block.kind === "list")
          return block.marker === "•" ? (
            <ul key={index}>
              <li>{inline(block.text)}</li>
            </ul>
          ) : (
            <ol key={index} start={parseInt(block.marker ?? "1", 10)}>
              <li>{inline(block.text)}</li>
            </ol>
          );
        return <p key={index}>{inline(block.text)}</p>;
      })}
    </div>
  );
}
