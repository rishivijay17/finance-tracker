"""
Generates a realistic HDFC Bank statement PDF for Rishi Kumar, March 2024.
Run: python generate_statement.py
Output: my_sample_statement.pdf (in the same directory)
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "my_sample_statement.pdf")

# ── Colour palette ─────────────────────────────────────────────────────────────
HDFC_BLUE   = colors.HexColor("#004C97")
HDFC_RED    = colors.HexColor("#EE3131")
LIGHT_GREY  = colors.HexColor("#F5F5F5")
MID_GREY    = colors.HexColor("#CCCCCC")
DARK_GREY   = colors.HexColor("#444444")
BLACK       = colors.black
WHITE       = colors.white
DEBIT_RED   = colors.HexColor("#CC0000")
CREDIT_GRN  = colors.HexColor("#007700")

# ── Transactions ───────────────────────────────────────────────────────────────
#  (date, narration, ref_no, debit, credit, balance)
OPENING_BALANCE = 18_420.50

raw_txns = [
    ("01 Mar 2024", "NEFT - Salary Credit - Rishi Kumar",      "NEFT0000001", None,    65000.00),
    ("02 Mar 2024", "UPI/Zomato Food Delivery/Order#ZOM2403A",  "UPI00010201", 450.00,  None),
    ("03 Mar 2024", "UPI/HPCL Petrol Pump - Koramangala",       "UPI00010302", 2000.00, None),
    ("05 Mar 2024", "UPI/Blinkit Groceries/Ord#BLK240305",      "UPI00010503", 1200.00, None),
    ("06 Mar 2024", "UPI/Swiggy Food Order/Ord#SWG240306",      "UPI00010604", 340.00,  None),
    ("07 Mar 2024", "UPI/Zepto Online Groceries/Ord#ZPT240307", "UPI00010705", 650.00,  None),
    ("08 Mar 2024", "BBPS/BESCOM Electricity Bill/Mar2024",     "BBPS0001008", 1240.00, None),
    ("10 Mar 2024", "UPI/Zomato Food Delivery/Order#ZOM2403B",  "UPI00011001", 380.00,  None),
    ("11 Mar 2024", "UPI/Amazon.in Shopping/Ord#AMZ240311",     "UPI00011102", 1299.00, None),
    ("12 Mar 2024", "UPI/Swiggy Instamart/Ord#SIM240312",       "UPI00011203", 980.00,  None),
    ("13 Mar 2024", "UPI/HPCL Petrol Pump - BTM Layout",        "UPI00011304", 1500.00, None),
    ("14 Mar 2024", "UPI/Jio Prepaid Recharge/9876543210",      "UPI00011405", 239.00,  None),
    ("15 Mar 2024", "ATM Cash Withdrawal - HDFC ATM Koramanga", "ATM00011506", 5000.00, None),
    ("16 Mar 2024", "UPI/Netflix India Subscription/Mar2024",   "UPI00011607", 649.00,  None),
    ("18 Mar 2024", "UPI/Swiggy Food Delivery/Ord#SWG240318",   "UPI00011808", 290.00,  None),
    ("19 Mar 2024", "UPI/Flipkart Purchase/Ord#FLK240319",      "UPI00011909", 2199.00, None),
    ("20 Mar 2024", "UPI/Zomato Food Delivery/Order#ZOM2403C",  "UPI00012010", 520.00,  None),
    ("21 Mar 2024", "UPI/Blinkit Groceries/Ord#BLK240321",      "UPI00012111", 890.00,  None),
    ("22 Mar 2024", "UPI/Amazon.in Shopping/Ord#AMZ240322",     "UPI00012212", 3499.00, None),
    ("25 Mar 2024", "UPI/Hotstar Premium Subscription/Mar2024", "UPI00012513", 299.00,  None),
]

# Build running balance
txns = []
balance = OPENING_BALANCE
for date, narration, ref, debit, credit in raw_txns:
    if credit:
        balance += credit
    if debit:
        balance -= debit
    txns.append((date, narration, ref, debit, credit, round(balance, 2)))

CLOSING_BALANCE = round(balance, 2)

# ── Helpers ────────────────────────────────────────────────────────────────────
def fmt(amount):
    if amount is None:
        return ""
    return f"₹{amount:,.2f}"

def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=15*mm,
        rightMargin=15*mm,
        topMargin=12*mm,
        bottomMargin=12*mm,
    )

    styles = getSampleStyleSheet()
    w = A4[0] - 30*mm  # usable width

    def style(name, **kw):
        s = ParagraphStyle(name, **kw)
        return s

    # ── Styles ─────────────────────────────────────────────────────────────────
    bank_name_style = style("BankName",
        fontName="Helvetica-Bold", fontSize=22, textColor=HDFC_BLUE, leading=26)
    tagline_style   = style("Tagline",
        fontName="Helvetica", fontSize=8, textColor=HDFC_RED, leading=10)
    header_label    = style("HdrLabel",
        fontName="Helvetica", fontSize=7.5, textColor=DARK_GREY, leading=10)
    header_value    = style("HdrValue",
        fontName="Helvetica-Bold", fontSize=8.5, textColor=BLACK, leading=11)
    section_title   = style("SectionTitle",
        fontName="Helvetica-Bold", fontSize=9, textColor=WHITE, leading=11)
    normal8         = style("Normal8",
        fontName="Helvetica", fontSize=8, textColor=BLACK, leading=10)
    bold8           = style("Bold8",
        fontName="Helvetica-Bold", fontSize=8, textColor=BLACK, leading=10)
    footer_style    = style("Footer",
        fontName="Helvetica", fontSize=7, textColor=DARK_GREY,
        alignment=TA_CENTER, leading=9)

    story = []

    # ── HEADER BLOCK ──────────────────────────────────────────────────────────
    # Logo row: bank name left, address right
    header_data = [
        [
            Paragraph("HDFC Bank", bank_name_style),
            Paragraph(
                "<b>HDFC Bank Ltd.</b><br/>Branch: Koramangala, Bengaluru - 560034<br/>"
                "IFSC: HDFC0001234  |  MICR: 560240049",
                style("Addr", fontName="Helvetica", fontSize=7.5,
                      textColor=DARK_GREY, leading=10, alignment=TA_RIGHT)
            ),
        ]
    ]
    header_tbl = Table(header_data, colWidths=[w*0.5, w*0.5])
    header_tbl.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
    ]))
    story.append(header_tbl)
    story.append(Paragraph("We understand your world", tagline_style))
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width="100%", thickness=2, color=HDFC_BLUE))
    story.append(Spacer(1, 2*mm))

    # Statement title bar
    title_tbl = Table(
        [[Paragraph("ACCOUNT STATEMENT", style("T", fontName="Helvetica-Bold",
            fontSize=11, textColor=WHITE, alignment=TA_CENTER, leading=14))]],
        colWidths=[w]
    )
    title_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), HDFC_BLUE),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]))
    story.append(title_tbl)
    story.append(Spacer(1, 3*mm))

    # Account info grid
    def lv(label, value):
        return [Paragraph(label, header_label), Paragraph(value, header_value)]

    info_data = [
        lv("Account Holder", "Rishi Kumar") +
        lv("Account Number", "XXXX XXXX 4821"),
        lv("Account Type", "Savings Account") +
        lv("Branch", "Koramangala, Bengaluru"),
        lv("Statement Period", "01 March 2024 to 31 March 2024") +
        lv("IFSC Code", "HDFC0001234"),
        lv("Opening Balance", fmt(OPENING_BALANCE)) +
        lv("Closing Balance", fmt(CLOSING_BALANCE)),
    ]

    info_tbl = Table(info_data, colWidths=[w*0.17, w*0.33, w*0.17, w*0.33])
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), LIGHT_GREY),
        ("GRID",       (0,0), (-1,-1), 0.3, MID_GREY),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
    ]))
    story.append(info_tbl)
    story.append(Spacer(1, 4*mm))

    # ── TRANSACTION TABLE ─────────────────────────────────────────────────────
    col_hdr = style("ColHdr",
        fontName="Helvetica-Bold", fontSize=8, textColor=WHITE,
        alignment=TA_CENTER, leading=10)
    cell_c = style("CellC",
        fontName="Helvetica", fontSize=7.5, textColor=BLACK,
        alignment=TA_CENTER, leading=10)
    cell_r = style("CellR",
        fontName="Helvetica", fontSize=7.5, textColor=BLACK,
        alignment=TA_RIGHT, leading=10)
    cell_l = style("CellL",
        fontName="Helvetica", fontSize=7.5, textColor=BLACK,
        alignment=TA_LEFT, leading=10)
    debit_style  = style("Debit",  fontName="Helvetica-Bold", fontSize=7.5,
        textColor=DEBIT_RED, alignment=TA_RIGHT, leading=10)
    credit_style = style("Credit", fontName="Helvetica-Bold", fontSize=7.5,
        textColor=CREDIT_GRN, alignment=TA_RIGHT, leading=10)

    COL_W = [22*mm, 75*mm, 30*mm, 22*mm, 22*mm, 26*mm]

    # Opening balance row
    table_data = [
        [
            Paragraph("Date", col_hdr),
            Paragraph("Narration", col_hdr),
            Paragraph("Reference No.", col_hdr),
            Paragraph("Debit (₹)", col_hdr),
            Paragraph("Credit (₹)", col_hdr),
            Paragraph("Balance (₹)", col_hdr),
        ],
        [
            Paragraph("01 Mar 2024", cell_c),
            Paragraph("Opening Balance", style("OB", fontName="Helvetica-BoldOblique",
                fontSize=7.5, textColor=DARK_GREY, alignment=TA_LEFT, leading=10)),
            Paragraph("—", cell_c),
            Paragraph("", cell_r),
            Paragraph("", cell_r),
            Paragraph(f"{OPENING_BALANCE:,.2f}", style("Bal0",
                fontName="Helvetica-Bold", fontSize=7.5, textColor=BLACK,
                alignment=TA_RIGHT, leading=10)),
        ],
    ]

    row_styles = []
    for i, (date, narration, ref, debit, credit, bal) in enumerate(txns):
        row_idx = i + 2  # +2 for header and opening balance row
        debit_txt  = f"{debit:,.2f}"  if debit  else ""
        credit_txt = f"{credit:,.2f}" if credit else ""

        table_data.append([
            Paragraph(date, cell_c),
            Paragraph(narration, cell_l),
            Paragraph(ref, style("Ref", fontName="Helvetica", fontSize=7,
                textColor=DARK_GREY, alignment=TA_CENTER, leading=9)),
            Paragraph(debit_txt,  debit_style  if debit  else cell_r),
            Paragraph(credit_txt, credit_style if credit else cell_r),
            Paragraph(f"{bal:,.2f}", style("BalR", fontName="Helvetica-Bold",
                fontSize=7.5, textColor=BLACK, alignment=TA_RIGHT, leading=10)),
        ])

        if row_idx % 2 == 0:
            row_styles.append(("BACKGROUND", (0, row_idx), (-1, row_idx), LIGHT_GREY))

    # Closing balance row
    close_idx = len(txns) + 2
    table_data.append([
        Paragraph("31 Mar 2024", cell_c),
        Paragraph("Closing Balance", style("CB", fontName="Helvetica-BoldOblique",
            fontSize=7.5, textColor=DARK_GREY, alignment=TA_LEFT, leading=10)),
        Paragraph("—", cell_c),
        Paragraph("", cell_r),
        Paragraph("", cell_r),
        Paragraph(f"{CLOSING_BALANCE:,.2f}", style("BalClose",
            fontName="Helvetica-Bold", fontSize=8, textColor=HDFC_BLUE,
            alignment=TA_RIGHT, leading=10)),
    ])

    base_styles = [
        ("BACKGROUND",    (0, 0),          (-1, 0),          HDFC_BLUE),
        ("GRID",          (0, 0),          (-1, -1),         0.3, MID_GREY),
        ("LINEBELOW",     (0, 0),          (-1, 0),          1,   HDFC_BLUE),
        ("LINEABOVE",     (0, close_idx),  (-1, close_idx),  1,   HDFC_BLUE),
        ("BACKGROUND",    (0, close_idx),  (-1, close_idx),  colors.HexColor("#E8EEF7")),
        ("TOPPADDING",    (0, 0),          (-1, -1),         4),
        ("BOTTOMPADDING", (0, 0),          (-1, -1),         4),
        ("LEFTPADDING",   (0, 0),          (-1, -1),         4),
        ("RIGHTPADDING",  (0, 0),          (-1, -1),         4),
        ("VALIGN",        (0, 0),          (-1, -1),         "MIDDLE"),
        # Opening balance row stripe
        ("BACKGROUND",    (0, 1),          (-1, 1),          colors.HexColor("#EEF3FB")),
    ]

    txn_table = Table(table_data, colWidths=COL_W, repeatRows=1)
    txn_table.setStyle(TableStyle(base_styles + row_styles))
    story.append(txn_table)
    story.append(Spacer(1, 5*mm))

    # ── SUMMARY BOX ───────────────────────────────────────────────────────────
    total_debits  = sum(t[3] for t in txns if t[3])
    total_credits = sum(t[4] for t in txns if t[4])

    summary_data = [
        [
            Paragraph("TRANSACTION SUMMARY", style("SumHdr",
                fontName="Helvetica-Bold", fontSize=8.5, textColor=WHITE,
                alignment=TA_CENTER, leading=11)),
            "", "",
        ],
        [
            Paragraph("Total Credits", header_label),
            Paragraph("Total Debits", header_label),
            Paragraph("Net Change", header_label),
        ],
        [
            Paragraph(fmt(total_credits), style("SumV",
                fontName="Helvetica-Bold", fontSize=9,
                textColor=CREDIT_GRN, alignment=TA_LEFT, leading=11)),
            Paragraph(fmt(total_debits), style("SumVD",
                fontName="Helvetica-Bold", fontSize=9,
                textColor=DEBIT_RED, alignment=TA_LEFT, leading=11)),
            Paragraph(fmt(total_credits - total_debits), style("SumVN",
                fontName="Helvetica-Bold", fontSize=9,
                textColor=HDFC_BLUE, alignment=TA_LEFT, leading=11)),
        ],
    ]
    summary_tbl = Table(summary_data, colWidths=[w/3, w/3, w/3])
    summary_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), HDFC_BLUE),
        ("SPAN",          (0,0), (-1,0)),
        ("BACKGROUND",    (0,1), (-1,-1), LIGHT_GREY),
        ("GRID",          (0,0), (-1,-1), 0.3, MID_GREY),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
    ]))
    story.append(summary_tbl)
    story.append(Spacer(1, 5*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MID_GREY))
    story.append(Spacer(1, 2*mm))

    # ── FOOTER ────────────────────────────────────────────────────────────────
    footer_lines = [
        "This is a computer-generated statement and does not require a signature.",
        "For queries, contact our 24×7 PhoneBanking: 1800-202-6161 | Email: support@hdfcbank.com",
        "HDFC Bank Ltd., HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai - 400 013.",
        "Registered Office: HDFC Bank Ltd., HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai 400 013.",
        "CIN: L65920MH1994PLC080618  |  GSTIN: 27AAAAH0137R2ZH",
    ]
    for line in footer_lines:
        story.append(Paragraph(line, footer_style))

    doc.build(story)
    print(f"OK Generated: {OUTPUT}")
    print(f"   Transactions : {len(txns)}")
    print(f"   Opening bal  : Rs.{OPENING_BALANCE:,.2f}")
    print(f"   Closing bal  : Rs.{CLOSING_BALANCE:,.2f}")


if __name__ == "__main__":
    build_pdf()
