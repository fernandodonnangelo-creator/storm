const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  ExternalHyperlink, LevelFormat, Footer, PageNumber, convertInchesToTwip,
} = require('docx');

const SRC = '/home/user/storm/docs/academic-research-skills.md';
const OUT = '/home/user/storm/docs/academic-research-skills.docx';

const USABLE = 9020;            // A4 portrait minus 1" margins, in DXA
const MONO = 'Consolas';
const ACCENT = '1F4E79';
const CODE_BG = 'F2F4F7';
const HEAD_BG = 'E8EDF3';

// ---------- inline parsing: **bold**, `code`, [text](url) ----------
function inline(text, base = {}) {
  const runs = [];
  const re = /(\*\*(.+?)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0, m;
  const push = (t, opts) => { if (t) runs.push(new TextRun({ text: t, ...base, ...opts })); };
  while ((m = re.exec(text)) !== null) {
    push(text.slice(last, m.index), {});
    // bold text may itself contain `code` — parse it recursively
    if (m[2] !== undefined) runs.push(...inline(m[2], { ...base, bold: true }));
    else if (m[4] !== undefined) push(m[4], { font: MONO, size: 19 });
    else {
      // link text may itself contain `code` / **bold** — parse it recursively
      runs.push(new ExternalHyperlink({
        link: m[7],
        children: inline(m[6], { ...base, style: 'Hyperlink' }),
      }));
    }
    last = m.index + m[0].length;
  }
  push(text.slice(last), {});
  return runs.length ? runs : [new TextRun({ text: '', ...base })];
}

// ---------- block builders ----------
const para = (text, opts = {}) => new Paragraph({
  children: inline(text),
  spacing: { after: 140, line: 276 },
  ...opts,
});

const heading = (text, level) => new Paragraph({
  children: inline(text),
  heading: level,
  spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 280, after: 140 },
});

function codeBlock(lines) {
  return lines.map((l, i) => new Paragraph({
    children: [new TextRun({ text: l || ' ', font: MONO, size: 18 })],
    shading: { type: ShadingType.CLEAR, fill: CODE_BG },
    spacing: { before: i === 0 ? 100 : 0, after: i === lines.length - 1 ? 160 : 0, line: 240 },
    indent: { left: 220, right: 220 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 8 },
    },
  }));
}

function colWidths(n) {
  if (n === 2) return [2700, 6320];
  if (n === 4) return [1500, 2900, 1350, 3270];
  const even = Math.floor(USABLE / n);
  const w = Array(n).fill(even);
  w[n - 1] += USABLE - even * n;
  return w;
}

function buildTable(rows) {
  const n = rows[0].length;
  const widths = colWidths(n);
  const mkCell = (txt, isHead, idx) => new TableCell({
    width: { size: widths[idx], type: WidthType.DXA },
    shading: isHead ? { type: ShadingType.CLEAR, fill: HEAD_BG } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: inline(txt, isHead ? { bold: true, size: 19 } : { size: 19 }),
      spacing: { after: 0, line: 240 },
    })],
  });
  return new Table({
    columnWidths: widths,
    width: { size: USABLE, type: WidthType.DXA },
    rows: rows.map((cells, r) => new TableRow({
      tableHeader: r === 0,
      children: cells.map((c, i) => mkCell(c, r === 0, i)),
    })),
  });
}

const splitRow = (line) =>
  line.replace(/^\||\|$/g, '').split('|').map((s) => s.trim());

const hr = () => new Paragraph({
  text: '',
  spacing: { before: 120, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C6CFDA', space: 6 } },
});

// ---------- walk the markdown ----------
const src = fs.readFileSync(SRC, 'utf8').split('\n');
const body = [];
let i = 0;

while (i < src.length) {
  const line = src[i];

  if (/^```/.test(line)) {                                  // fenced code
    const buf = [];
    i++;
    while (i < src.length && !/^```/.test(src[i])) buf.push(src[i++]);
    i++;
    body.push(...codeBlock(buf));
    continue;
  }

  if (/^\|/.test(line) && /^\|[\s:|-]+\|$/.test(src[i + 1] || '')) {   // table
    const rows = [splitRow(line)];
    i += 2;
    while (i < src.length && /^\|/.test(src[i])) rows.push(splitRow(src[i++]));
    body.push(buildTable(rows));
    body.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    continue;
  }

  if (/^#{1,4} /.test(line)) {
    const lvl = line.match(/^#+/)[0].length;
    const levels = [HeadingLevel.TITLE, HeadingLevel.HEADING_1,
                    HeadingLevel.HEADING_2, HeadingLevel.HEADING_3];
    const text = line.replace(/^#+\s*/, '');
    if (lvl === 1) {
      body.push(new Paragraph({
        children: inline(text),
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      }));
    } else {
      body.push(heading(text, levels[lvl - 1]));
    }
    i++;
    continue;
  }

  if (/^---\s*$/.test(line)) { body.push(hr()); i++; continue; }

  if (/^[-*] /.test(line)) {                                 // bullet list
    while (i < src.length && /^[-*] /.test(src[i])) {
      let txt = src[i].replace(/^[-*]\s+/, '');
      i++;
      while (i < src.length && /^\s{2,}\S/.test(src[i])) txt += ' ' + src[i++].trim();
      body.push(new Paragraph({
        children: inline(txt),
        numbering: { reference: 'bullets', level: 0 },
        spacing: { after: 100, line: 276 },
      }));
    }
    continue;
  }

  if (/^> /.test(line)) {                                    // blockquote
    const buf = [];
    while (i < src.length && /^> /.test(src[i])) buf.push(src[i++].replace(/^>\s?/, ''));
    buf.filter((b) => b.trim()).forEach((b) => body.push(new Paragraph({
      children: inline(b, { italics: true, color: '44546A' }),
      indent: { left: 360 },
      spacing: { after: 120, line: 276 },
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'A6B4C4', space: 10 } },
    })));
    continue;
  }

  if (!line.trim()) { i++; continue; }

  // paragraph: join continuation lines
  let txt = line;
  i++;
  while (i < src.length && src[i].trim() && !/^(#{1,4} |[-*] |> |\||```|---\s*$)/.test(src[i])) {
    txt += ' ' + src[i++].trim();
  }
  body.push(para(txt));
}

// ---------- document ----------
const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 360, hanging: 220 } } },
      }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 21 } },
    },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', quickFormat: true,
        run: { size: 40, bold: true, color: ACCENT, font: 'Calibri' } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, color: ACCENT, font: 'Calibri' } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', quickFormat: true,
        run: { size: 25, bold: true, color: '2E74B5', font: 'Calibri' } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, color: '404040', font: 'Calibri' } },
      { id: 'Hyperlink', name: 'Hyperlink', basedOn: 'Normal',
        run: { color: '0563C1', underline: {} } },
    ],
  },
  sections: [{
    properties: {
      page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1), right: convertInchesToTwip(1) } },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '808080' })],
        })],
      }),
    },
    children: body,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log('wrote', OUT, buf.length, 'bytes');
});
