"""Grille texte d'un xlsx. Gemini renvoie 500 si on lui envoie le classeur brut."""

import zipfile
from io import BytesIO
from xml.etree import ElementTree as ET

_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
_OFFICE_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
_MAX_BLANK_GAP = 3


def spreadsheet_to_text(data: bytes) -> str:
    """Une ligne par rangée, cellules séparées par ' | ', lignes vides conservées."""
    try:
        return _workbook_text(data)
    except (zipfile.BadZipFile, KeyError, ET.ParseError, ValueError):
        return ""


def _workbook_text(data: bytes) -> str:
    with zipfile.ZipFile(BytesIO(data)) as zf:
        strings = _shared_strings(zf)
        parts = [
            _render_sheet(zf, name, path, strings)
            for name, path in _sheet_targets(zf)
        ]
    return "\n\n".join(part for part in parts if part.strip())


def _shared_strings(zf: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return [_si_text(si) for si in root.findall(f"{{{_MAIN}}}si")]


def _si_text(si: ET.Element) -> str:
    return "".join(node.text or "" for node in si.iter(f"{{{_MAIN}}}t"))


def _sheet_targets(zf: zipfile.ZipFile) -> list[tuple[str, str]]:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    targets = {_rel_id(rel): _rel_path(rel.get("Target") or "") for rel in rels}
    sheets: list[tuple[str, str]] = []
    for sheet in workbook.findall(f".//{{{_MAIN}}}sheet"):
        path = targets.get(sheet.get(f"{{{_OFFICE_REL}}}id") or "")
        if path:
            sheets.append((sheet.get("name") or "sheet", path))
    return sheets


def _rel_id(rel: ET.Element) -> str:
    return rel.get("Id") or rel.get(f"{{{_PKG_REL}}}id") or ""


def _rel_path(target: str) -> str:
    cleaned = target.lstrip("/")
    if cleaned.startswith("xl/"):
        return cleaned
    return f"xl/{cleaned}"


def _render_sheet(zf: zipfile.ZipFile, name: str, path: str, strings: list[str]) -> str:
    root = ET.fromstring(zf.read(path))
    lines = [f"# {name}"]
    previous = 0
    for row in root.findall(f".//{{{_MAIN}}}row"):
        number = int(row.get("r") or previous + 1)
        gap = min(max(number - previous - 1, 0), _MAX_BLANK_GAP)
        lines.extend([""] * gap)
        lines.append(_render_row(row, strings))
        previous = number
    return "\n".join(lines).rstrip()


def _render_row(row: ET.Element, strings: list[str]) -> str:
    placed = {
        _col_index(cell.get("r") or "A"): _cell_value(cell, strings)
        for cell in row.findall(f"{{{_MAIN}}}c")
    }
    if not placed:
        return ""
    width = max(placed) + 1
    return " | ".join(placed.get(index, "") for index in range(width))


def _col_index(ref: str) -> int:
    number = 0
    for char in ref:
        if not char.isalpha():
            break
        number = number * 26 + (ord(char.upper()) - 64)
    return max(number - 1, 0)


def _cell_value(cell: ET.Element, strings: list[str]) -> str:
    kind = cell.get("t") or ""
    if kind == "inlineStr":
        return _si_text(cell)
    raw = _value_node(cell)
    if kind == "s":
        return _shared_at(strings, raw)
    if kind == "b":
        return "TRUE" if raw == "1" else "FALSE"
    return raw


def _value_node(cell: ET.Element) -> str:
    node = cell.find(f"{{{_MAIN}}}v")
    return node.text if node is not None and node.text else ""


def _shared_at(strings: list[str], raw: str) -> str:
    try:
        return strings[int(raw)]
    except (ValueError, IndexError):
        return ""
