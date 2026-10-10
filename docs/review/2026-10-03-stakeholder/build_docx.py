"""Convert the stakeholder markdown report to DOCX and CSV. Does not modify application source."""
from __future__ import annotations

import csv
import re
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parent
MD = ROOT / "PMTwin-UAT-Stakeholder-Report-2026-10-03.md"
DOCX = ROOT / "PMTwin-UAT-Stakeholder-Report-2026-10-03.docx"
XLSX = ROOT / "PMTwin-UAT-Requirements-Traceability-2026-10-03.xlsx"
CSV_PATH = ROOT / "PMTwin-UAT-Requirements-Traceability-2026-10-03.csv"


def set_run_font(run, name="Calibri", size=11, bold=False, color=None):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = RGBColor(*color)


def add_rich(paragraph, text, size=11, bold=False, color=None):
    text = text.replace("`", "")
    parts = re.split(r"(\*\*[^*]+\*\*)", text)
    for part in parts:
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            run = paragraph.add_run(part[2:-2])
            set_run_font(run, size=size, bold=True, color=color)
        else:
            run = paragraph.add_run(part)
            set_run_font(run, size=size, bold=bold, color=color)


def shade_cell(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = tcPr.makeelement(qn("w:shd"), {
        qn("w:fill"): hex_color,
        qn("w:val"): "clear",
    })
    tcPr.append(shd)


def add_table(doc, rows):
    if not rows:
        return
    cols = max(len(r) for r in rows)
    table = doc.add_table(rows=len(rows), cols=cols)
    table.style = "Table Grid"
    for i, row in enumerate(rows):
        for j in range(cols):
            value = row[j] if j < len(row) else ""
            cell = table.rows[i].cells[j]
            cell.text = ""
            p = cell.paragraphs[0]
            add_rich(p, value, size=9, bold=(i == 0), color=(255, 255, 255) if i == 0 else None)
            if i == 0:
                shade_cell(cell, "1F4E79")
            elif i % 2 == 0:
                shade_cell(cell, "F3F6FA")
    doc.add_paragraph()


def build_docx():
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Cm(1.8)
    section.bottom_margin = Cm(1.8)
    section.left_margin = Cm(1.8)
    section.right_margin = Cm(1.8)
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    lines = MD.read_text(encoding="utf-8").splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if not line.strip():
            i += 1
            continue
        if line.strip() == "---":
            i += 1
            continue
        if line.startswith("# "):
            p = doc.add_heading(line[2:].strip(), level=0)
            for run in p.runs:
                set_run_font(run, size=22, bold=True, color=(31, 78, 121))
            i += 1
            continue
        if line.startswith("## "):
            p = doc.add_heading(line[3:].strip(), level=1)
            for run in p.runs:
                set_run_font(run, size=16, bold=True, color=(31, 78, 121))
            i += 1
            continue
        if line.startswith("### "):
            p = doc.add_heading(line[4:].strip(), level=2)
            for run in p.runs:
                set_run_font(run, size=13, bold=True, color=(47, 84, 150))
            i += 1
            continue
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                raw = lines[i].strip().strip("|")
                cells = [c.strip() for c in raw.split("|")]
                if not all(set(c) <= set("-: ") for c in cells):
                    rows.append(cells)
                i += 1
            add_table(doc, rows)
            continue
        if line.startswith("- "):
            while i < len(lines) and lines[i].startswith("- "):
                p = doc.add_paragraph(style="List Bullet")
                add_rich(p, lines[i][2:].strip(), size=11)
                i += 1
            continue
        if re.match(r"^\d+\. ", line):
            while i < len(lines) and re.match(r"^\d+\. ", lines[i]):
                text = re.sub(r"^\d+\. ", "", lines[i])
                p = doc.add_paragraph(style="List Number")
                add_rich(p, text.strip(), size=11)
                i += 1
            continue
        buf = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not lines[i].startswith(("#", "|", "-", "---")) and not re.match(r"^\d+\. ", lines[i]):
            buf.append(lines[i].rstrip())
            i += 1
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(8)
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        add_rich(p, " ".join(buf), size=11)
    footer = section.footer.paragraphs[0]
    footer.text = "PMTwin stakeholder report  ·  3 October 2026  ·  Deployed UAT version not verified"
    for run in footer.runs:
        set_run_font(run, size=9, color=(89, 89, 89))
    doc.save(DOCX)
    print("docx", DOCX)


def build_csv():
    wb = load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["Traceability"]
    with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        for row in ws.iter_rows(values_only=True):
            writer.writerow(["" if v is None else v for v in row])
    wb.close()
    print("csv", CSV_PATH)


if __name__ == "__main__":
    build_docx()
    build_csv()
