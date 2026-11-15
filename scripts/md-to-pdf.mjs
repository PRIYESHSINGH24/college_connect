import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const mdPath = process.argv[2] ?? "docs/CampusLoop-DBMS-Report.md";
const pdfPath = process.argv[3] ?? "docs/CampusLoop-DBMS-Report.pdf";
const md = readFileSync(mdPath, "utf8");

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(text) {
  let out = esc(text);
  out = out.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

const lines = md.replace(/\r\n/g, "\n").split("\n");
const html = [];
let i = 0;
let inList = null;

function closeList() {
  if (inList) {
    html.push(`</${inList}>`);
    inList = null;
  }
}

while (i < lines.length) {
  const line = lines[i];

  // fenced code
  if (/^```/.test(line)) {
    closeList();
    const lang = line.slice(3).trim();
    i++;
    const buf = [];
    while (i < lines.length && !/^```/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    i++; // closing fence
    html.push(
      `<pre class="code"${lang ? ` data-lang="${esc(lang)}"` : ""}><code>${esc(
        buf.join("\n"),
      )}</code></pre>`,
    );
    continue;
  }

  // table
  if (/^\|/.test(line) && /^\|[\s:|-]+\|$/.test(lines[i + 1] ?? "")) {
    closeList();
    const parseRow = (row) =>
      row
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());
    const header = parseRow(line);
    i += 2;
    const body = [];
    while (i < lines.length && /^\|/.test(lines[i])) {
      body.push(parseRow(lines[i]));
      i++;
    }
    html.push("<table><thead><tr>");
    for (const h of header) html.push(`<th>${inline(h)}</th>`);
    html.push("</tr></thead><tbody>");
    for (const r of body) {
      html.push("<tr>");
      for (const c of r) html.push(`<td>${inline(c)}</td>`);
      html.push("</tr>");
    }
    html.push("</tbody></table>");
    continue;
  }

  // heading
  const h = line.match(/^(#{1,6})\s+(.*)$/);
  if (h) {
    closeList();
    const level = h[1].length;
    html.push(`<h${level}>${inline(h[2])}</h${level}>`);
    i++;
    continue;
  }

  // horizontal rule
  if (/^---+\s*$/.test(line)) {
    closeList();
    html.push("<hr />");
    i++;
    continue;
  }

  // blockquote
  if (/^>\s?/.test(line)) {
    closeList();
    const buf = [];
    while (i < lines.length && (/^>\s?/.test(lines[i]) || lines[i].trim() === "")) {
      if (lines[i].trim() === "" && !/^>/.test(lines[i + 1] ?? "")) break;
      buf.push(lines[i].replace(/^>\s?/, ""));
      i++;
    }
    const parts = [];
    let inQuoteList = false;
    for (const b of buf) {
      if (/^[-*]\s+/.test(b)) {
        if (!inQuoteList) {
          parts.push("<ul>");
          inQuoteList = true;
        }
        parts.push(`<li>${inline(b.replace(/^[-*]\s+/, ""))}</li>`);
      } else if (b.trim() === "") {
        if (inQuoteList) {
          parts.push("</ul>");
          inQuoteList = false;
        }
      } else {
        if (inQuoteList) {
          parts.push("</ul>");
          inQuoteList = false;
        }
        parts.push(`<p>${inline(b)}</p>`);
      }
    }
    if (inQuoteList) parts.push("</ul>");
    html.push(`<blockquote>${parts.join("")}</blockquote>`);
    continue;
  }

  // lists
  const ul = line.match(/^[-*]\s+(.*)$/);
  const ol = line.match(/^(\d+)\.\s+(.*)$/);
  if (ul || ol) {
    const type = ul ? "ul" : "ol";
    if (inList && inList !== type) closeList();
    if (!inList) {
      html.push(`<${type}>`);
      inList = type;
    }
    // A list item may wrap onto indented continuation lines; keep them in the item.
    let text = ul ? ul[1] : ol[2];
    i++;
    while (
      i < lines.length &&
      /^\s{2,}\S/.test(lines[i]) &&
      !/^\s*([-*]\s|\d+\.\s|>|```|\|)/.test(lines[i])
    ) {
      text += " " + lines[i].trim();
      i++;
    }
    // A blank line only ends the list if the next line is not another item.
    while (lines[i] !== undefined && lines[i].trim() === "" && /^\s*([-*]\s|\d+\.\s)/.test(lines[i + 1] ?? "")) {
      i++;
      const m2 = lines[i].match(/^\s*(?:[-*]\s+|\d+\.\s+)(.*)$/);
      if (m2) {
        text += " " + m2[1];
        i++;
        while (/^\s{2,}\S/.test(lines[i] ?? "") && !/^\s*([-*]\s|\d+\.\s)/.test(lines[i] ?? "")) {
          text += " " + lines[i].trim();
          i++;
        }
      }
    }
    html.push(`<li>${inline(text)}</li>`);
    continue;
  }

  // blank
  if (line.trim() === "") {
    closeList();
    i++;
    continue;
  }

  // paragraph
  closeList();
  const buf = [];
  while (
    i < lines.length &&
    lines[i].trim() !== "" &&
    !/^(#{1,6}\s|```|\||>|[-*]\s|\d+\.\s|---+\s*$)/.test(lines[i])
  ) {
    buf.push(lines[i]);
    i++;
  }
  if (buf.length) html.push(`<p>${inline(buf.join(" "))}</p>`);
  else i++;
}
closeList();

const CSS = `
  @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 10pt; line-height: 1.55; color: #20231f; margin: 0;
  }
  h1 { font-size: 22pt; margin: 0 0 4pt; color: #4141b8; line-height: 1.2; }
  h2 { font-size: 14pt; margin: 22pt 0 8pt; padding-bottom: 4pt;
       border-bottom: 1.2pt solid #5555d9; color: #20231f; page-break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 14pt 0 5pt; color: #4141b8; page-break-after: avoid; }
  h4 { font-size: 10pt; margin: 10pt 0 4pt; page-break-after: avoid; }
  p { margin: 0 0 7pt; text-align: justify; }
  ul, ol { margin: 4pt 0 8pt; padding-left: 16pt; }
  li { margin-bottom: 3pt; }
  code { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 8.5pt;
         background: #efefe8; padding: 1pt 3pt; border-radius: 2pt; }
  pre.code { background: #f4f4ee; border: 0.6pt solid #e5e5df; border-left: 2.4pt solid #5555d9;
             border-radius: 3pt; padding: 7pt 9pt; overflow: hidden; white-space: pre-wrap;
             font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 7.4pt;
             line-height: 1.4; page-break-inside: avoid; margin: 6pt 0 9pt; }
  pre.code code { background: none; padding: 0; font-size: inherit; }
  table { width: 100%; border-collapse: collapse; margin: 6pt 0 11pt;
          font-size: 8.4pt; page-break-inside: avoid; }
  td, th { word-break: break-word; }
  td code, th code { overflow-wrap: anywhere; }
  td:first-child, th:first-child { min-width: 45mm; }
  th { background: #ececfc; color: #20231f; text-align: left; font-weight: 700;
       padding: 4pt 5pt; border: 0.6pt solid #d8d8ce; }
  td { padding: 3.6pt 5pt; border: 0.6pt solid #e5e5df; vertical-align: top; }
  tr:nth-child(even) td { background: #fafaf5; }
  blockquote { margin: 7pt 0; padding: 6pt 10pt; background: #fff8e1;
               border-left: 2.4pt solid #a86d17; font-size: 9pt; }
  blockquote p { margin: 0 0 3pt; }
  blockquote li { margin-left: 10pt; }
  hr { border: 0; border-top: 0.6pt solid #e5e5df; margin: 12pt 0; }
  a { color: #4141b8; text-decoration: none; }
`;

const doc = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
<body>${html.join("\n")}</body></html>`;

mkdirSync("docs", { recursive: true });
writeFileSync("docs/.report-render.html", doc);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(doc, { waitUntil: "load" });
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: `<div style="width:100%;font-size:7pt;color:#8b8b83;padding:0 16mm;
    font-family:-apple-system,Helvetica,sans-serif;">CampusLoop — Database Systems Project Report</div>`,
  footerTemplate: `<div style="width:100%;font-size:7pt;color:#8b8b83;padding:0 16mm;
    font-family:-apple-system,Helvetica,sans-serif;display:flex;justify-content:space-between;">
    <span>PostgreSQL · 30 tables · 55 foreign keys · 21 triggers</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
  margin: { top: "20mm", bottom: "18mm", left: "16mm", right: "16mm" },
});
await browser.close();
console.log("PDF written:", pdfPath);
