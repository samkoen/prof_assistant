"""xlsx → grille texte : l'ordre des lignes (données puis questions) est conservé."""

import zipfile
from io import BytesIO

from app.services.spreadsheet_text import spreadsheet_to_text

_NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
_NS_OFFICE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
_NS_PKG = "http://schemas.openxmlformats.org/package/2006/relationships"


def mini_xlsx() -> bytes:
    """Classeur : ligne de données, ligne vide, ligne de question, trou en colonne B."""
    files = {
        "xl/sharedStrings.xml": (
            f'<sst xmlns="{_NS_MAIN}"><si><t>data</t></si><si><t>question</t></si></sst>'
        ),
        "xl/worksheets/sheet1.xml": (
            f'<worksheet xmlns="{_NS_MAIN}"><sheetData>'
            '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1"><v>12</v></c></row>'
            '<row r="3"><c r="A3" t="s"><v>1</v></c></row>'
            "</sheetData></worksheet>"
        ),
        "xl/workbook.xml": (
            f'<workbook xmlns="{_NS_MAIN}" xmlns:r="{_NS_OFFICE}">'
            '<sheets><sheet name="Mix" sheetId="1" r:id="rId1"/></sheets></workbook>'
        ),
        "xl/_rels/workbook.xml.rels": (
            f'<Relationships xmlns="{_NS_PKG}">'
            '<Relationship Id="rId1" Type="worksheet" Target="worksheets/sheet1.xml"/>'
            "</Relationships>"
        ),
    }
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w") as zf:
        for name, xml in files.items():
            zf.writestr(name, xml)
    return buffer.getvalue()


def test_grid_keeps_blank_row_and_column_gap():
    text = spreadsheet_to_text(mini_xlsx())
    assert text == "# Mix\ndata |  | 12\n\nquestion"


def test_invalid_workbook_is_empty():
    assert spreadsheet_to_text(b"PK\x03\x04not-a-workbook") == ""
