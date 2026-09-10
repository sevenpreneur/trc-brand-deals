import { Fragment, type ReactNode } from "react";

/** Dirender ke elemen React, bukan `dangerouslySetInnerHTML`: jawaban agent mengutip pesan WhatsApp dari pengirim mana pun. */

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;

function inline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={key}
          className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.85em] text-ink"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function tableCells(row: string): string[] {
  return row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

/** Baris pemisah header tabel: `| --- | :--: |`. */
function isDivider(row: string): boolean {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(row) && row.includes("-");
}

export default function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let index = 0;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-relaxed">
        {inline(paragraph.join(" "), `p-${blocks.length}`)}
      </p>
    );
    paragraph = [];
  }

  while (index < lines.length) {
    const line = lines[index];

    if (line.trim() === "") {
      flushParagraph();
      index += 1;
      continue;
    }

    if (line.trimStart().startsWith("```")) {
      flushParagraph();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trimStart().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre
          key={`code-${blocks.length}`}
          className="overflow-x-auto rounded-xl border border-hairline bg-surface-sunken p-3 font-mono text-xs leading-relaxed text-ink"
        >
          {code.join("\n")}
        </pre>
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      blocks.push(
        <p
          key={`h-${blocks.length}`}
          className={`font-bold text-ink ${level <= 2 ? "text-[15px]" : "text-sm"}`}
        >
          {inline(heading[2], `h-${blocks.length}`)}
        </p>
      );
      index += 1;
      continue;
    }

    // Tabel: baris header, pemisah, lalu isinya sampai baris non-tabel.
    if (
      line.includes("|") &&
      index + 1 < lines.length &&
      isDivider(lines[index + 1])
    ) {
      flushParagraph();
      const header = tableCells(line);
      index += 2;

      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }

      blocks.push(
        <div
          key={`table-${blocks.length}`}
          className="overflow-x-auto rounded-xl border border-hairline"
        >
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-hairline bg-surface-sunken">
                {header.map((cell, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-xs font-semibold whitespace-nowrap text-ink-2"
                  >
                    {inline(cell, `th-${i}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-hairline last:border-b-0"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`px-3 py-2 align-top ${
                        cellIndex === 0 ? "text-ink" : "tabular-nums text-ink-2"
                      }`}
                    >
                      {inline(cell, `td-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      const items: string[] = [];

      while (index < lines.length) {
        const current = lines[index];
        const match = ordered
          ? /^\s*\d+[.)]\s+(.*)$/.exec(current)
          : /^\s*[-*+]\s+(.*)$/.exec(current);
        if (!match) break;
        items.push(match[1]);
        index += 1;
      }

      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag
          key={`list-${blocks.length}`}
          className={`ml-5 flex flex-col gap-1.5 ${
            ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {inline(item, `li-${blocks.length}-${i}`)}
            </li>
          ))}
        </ListTag>
      );
      continue;
    }

    paragraph.push(line.trim());
    index += 1;
  }

  flushParagraph();

  return <div className="flex flex-col gap-3 text-sm text-ink">{blocks}</div>;
}
