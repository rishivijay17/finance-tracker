"""
Generate a realistic HDFC Bank sample statement PDF for testing.
Run with: python generate_sample_pdf.py
"""
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# ── Colour palette ─────────────────────────────────────────────────────────────
HDFC_BLUE   = colors.HexColor("#004C97")
HDFC_RED    = colors.HexColor("#EE3124")
STRIPE_BLUE = colors.HexColor("#EBF2FB")
HEADER_BG   = colors.HexColor("#F5F7FA")
BORDER_CLR  = colors.HexColor("#D0D5DD")
TEXT_DARK   = colors.HexColor("#101828")
TEXT_GREY   = colors.HexColor("#667085")
GREEN       = colors.HexColor("#027A48")
RED_TEXT    = colors.HexColor("#B42318")

# ── 25 realistic transactions ──────────────────────────────────────────────────
# Columns: Date | Description | Mode | Debit | Credit | Running Balance
TRANSACTIONS = [
    ("01 Mar 2024", "SALARY CREDIT - TECHCORP INDIA PVT LTD",     "NEFT", "",          "65,000.00", "1,10,230.50"),
    ("02 Mar 2024", "AMAZON.IN - ORDER #405-2891733-4829",         "UPI",  "1,299.00",  "",          "1,08,931.50"),
    ("03 Mar 2024", "ZOMATO FOOD DELIVERY",                         "UPI",  "456.00",    "",          "1,08,475.50"),
    ("04 Mar 2024", "OLA CABS - RIDE PAYMENT",                      "UPI",  "320.00",    "",          "1,08,155.50"),
    ("05 Mar 2024", "JIO PREPAID RECHARGE - 9876543210",            "UPI",  "239.00",    "",          "1,07,916.50"),
    ("06 Mar 2024", "BIGBASKET - GROCERY ORDER",                    "UPI",  "2,340.00",  "",          "1,05,576.50"),
    ("07 Mar 2024", "NETFLIX INDIA - MONTHLY SUBSCRIPTION",         "UPI",  "649.00",    "",          "1,04,927.50"),
    ("08 Mar 2024", "BOOKMYSHOW - PVR CINEMAS KORAMANGALA",         "UPI",  "850.00",    "",          "1,04,077.50"),
    ("09 Mar 2024", "SWIGGY - FOOD DELIVERY",                       "UPI",  "378.00",    "",          "1,03,699.50"),
    ("10 Mar 2024", "IRCTC TRAIN TKT BLR-HYD EXP 12785",           "Net",  "1,890.00",  "",          "1,01,809.50"),
    ("11 Mar 2024", "FLIPKART INTERNET SERVICES - ELECTRONICS",     "UPI",  "3,499.00",  "",          "98,310.50"),
    ("12 Mar 2024", "BESCOM ELECTRICITY BILL - MAR 2024",           "Net",  "1,240.00",  "",          "97,070.50"),
    ("14 Mar 2024", "HPCL PETROL PUMP - INDIRANAGAR BLR",          "UPI",  "2,000.00",  "",          "95,070.50"),
    ("15 Mar 2024", "ZOMATO FOOD DELIVERY",                         "UPI",  "612.00",    "",          "94,458.50"),
    ("16 Mar 2024", "CULT.FIT GYM MEMBERSHIP - MAR 2024",          "ECS",  "1,500.00",  "",          "92,958.50"),
    ("17 Mar 2024", "APOLLO PHARMACY - KORAMANGALA",                "UPI",  "890.00",    "",          "92,068.50"),
    ("18 Mar 2024", "ATM CASH WITHDRAWAL - HDFC ATM KORAMANGALA",  "ATM",  "5,000.00",  "",          "87,068.50"),
    ("19 Mar 2024", "SWIGGY INSTAMART - GROCERY DELIVERY",         "UPI",  "1,150.00",  "",          "85,918.50"),
    ("20 Mar 2024", "AMAZON.IN - LAPTOP ACCESSORIES ORDER",         "UPI",  "4,799.00",  "",          "81,119.50"),
    ("22 Mar 2024", "UBER INDIA - RIDE PAYMENT",                    "UPI",  "245.00",    "",          "80,874.50"),
    ("23 Mar 2024", "LIC OF INDIA PREMIUM - POLICY 987654321",      "ECS",  "3,200.00",  "",          "77,674.50"),
    ("25 Mar 2024", "ZOMATO FOOD DELIVERY",                         "UPI",  "890.00",    "",          "76,784.50"),
    ("26 Mar 2024", "DISNEY+ HOTSTAR PREMIUM MONTHLY",              "UPI",  "299.00",    "",          "76,485.50"),
    ("28 Mar 2024", "RELIANCE SMART STORE - BTM LAYOUT BLR",        "UPI",  "2,876.00",  "",          "73,609.50"),
    ("30 Mar 2024", "SAVINGS ACCOUNT INTEREST CREDIT",              "INT",  "",          "120.00",    "73,729.50"),
]

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "sample_statement.pdf")


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=1.3*cm,
        rightMargin=1.3*cm,
        topMargin=1.4*cm,
        bottomMargin=1.8*cm,
    )

    # Usable page width = 21cm - 2.6cm margins = 18.4cm
    PW = 18.4 * cm

    elements = []

    # ── 1. Bank header bar ────────────────────────────────────────────────────
    hdr = Table(
        [[
            Paragraph(
                '<font color="white" size="18"><b>HDFC BANK</b></font><br/>'
                '<font color="white" size="7">A New World of Banking</font>',
                ParagraphStyle("hl", alignment=TA_LEFT),
            ),
            Paragraph(
                '<font color="white" size="11"><b>Account Statement</b></font><br/>'
                '<font color="white" size="7.5">Period: 01 March 2024 — 31 March 2024</font>',
                ParagraphStyle("hr", alignment=TA_RIGHT),
            ),
        ]],
        colWidths=[PW * 0.52, PW * 0.48],
    )
    hdr.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), HDFC_BLUE),
        ("TOPPADDING",    (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("LEFTPADDING",   (0, 0), (0, -1),  14),
        ("RIGHTPADDING",  (-1, 0), (-1, -1), 14),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(hdr)
    elements.append(Spacer(1, 0.3*cm))

    # ── 2. Thin red accent line ───────────────────────────────────────────────
    accent = Table([[""]], colWidths=[PW])
    accent.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), HDFC_RED),
        ("TOPPADDING",    (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements.append(accent)
    elements.append(Spacer(1, 0.3*cm))

    # ── 3. Account details grid ───────────────────────────────────────────────
    lbl = ParagraphStyle("lbl", fontSize=7,   textColor=TEXT_GREY,  leading=10)
    val = ParagraphStyle("val", fontSize=8.5, textColor=TEXT_DARK,  leading=12)
    val_blue  = ParagraphStyle("vb",  fontSize=8.5, textColor=HDFC_BLUE, leading=12, fontName="Helvetica-Bold")
    val_green = ParagraphStyle("vg",  fontSize=8.5, textColor=GREEN,     leading=12, fontName="Helvetica-Bold")

    info_rows = [
        [
            Paragraph("Account Holder Name", lbl), Paragraph("RISHI KUMAR", val),
            Paragraph("Account Number",      lbl), Paragraph("XXXX XXXX XXXX 4782", val),
        ],
        [
            Paragraph("Branch",    lbl), Paragraph("Koramangala, Bengaluru — 560034", val),
            Paragraph("IFSC Code", lbl), Paragraph("HDFC0001234", val),
        ],
        [
            Paragraph("Account Type", lbl), Paragraph("Savings Account — Regular", val),
            Paragraph("Customer ID",  lbl), Paragraph("HDFC78451239", val),
        ],
        [
            Paragraph("Opening Balance (01 Mar 2024)", lbl),
            Paragraph("Rs. 45,230.50", val_blue),
            Paragraph("Closing Balance (31 Mar 2024)", lbl),
            Paragraph("Rs. 73,729.50", val_green),
        ],
    ]

    cw = [PW * 0.23, PW * 0.27, PW * 0.23, PW * 0.27]
    info_tbl = Table(info_rows, colWidths=cw)
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), HEADER_BG),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("BOX",           (0, 0), (-1, -1), 0.5, BORDER_CLR),
        ("LINEBELOW",     (0, 0), (-1, 2),  0.5, BORDER_CLR),
        ("LINEAFTER",     (1, 0), (1, -1),  0.5, BORDER_CLR),
    ]))
    elements.append(info_tbl)
    elements.append(Spacer(1, 0.45*cm))

    # ── 4. Section label ──────────────────────────────────────────────────────
    elements.append(Paragraph(
        "<b>Transaction Details</b>",
        ParagraphStyle("sec", fontSize=9, textColor=HDFC_BLUE, leading=14),
    ))
    elements.append(Spacer(1, 0.2*cm))

    # ── 5. Transaction table ──────────────────────────────────────────────────
    th   = ParagraphStyle("th",  fontSize=7.5, textColor=colors.white, fontName="Helvetica-Bold", alignment=TA_CENTER, leading=10)
    td   = ParagraphStyle("td",  fontSize=7.5, textColor=TEXT_DARK,    leading=10, alignment=TA_LEFT)
    tdm  = ParagraphStyle("tdm", fontSize=7.5, textColor=TEXT_GREY,    leading=10, alignment=TA_CENTER)
    tdd  = ParagraphStyle("tdd", fontSize=7.5, textColor=RED_TEXT,     leading=10, alignment=TA_RIGHT, fontName="Helvetica-Bold")
    tdc  = ParagraphStyle("tdc", fontSize=7.5, textColor=GREEN,        leading=10, alignment=TA_RIGHT, fontName="Helvetica-Bold")
    tdb  = ParagraphStyle("tdb", fontSize=7.5, textColor=HDFC_BLUE,    leading=10, alignment=TA_RIGHT, fontName="Helvetica-Bold")
    tdr  = ParagraphStyle("tdr", fontSize=7.5, textColor=TEXT_GREY,    leading=10, alignment=TA_RIGHT)

    # Column widths — total must equal PW (18.4cm)
    col_w = [2.4*cm, 7.6*cm, 1.2*cm, 2.3*cm, 2.3*cm, 2.6*cm]  # = 18.4cm

    rows = [[
        Paragraph("Date",           th),
        Paragraph("Transaction Details", th),
        Paragraph("Mode",           th),
        Paragraph("Debit (Rs.)",    th),
        Paragraph("Credit (Rs.)",   th),
        Paragraph("Balance (Rs.)",  th),
    ]]

    for date, desc, mode, debit, credit, balance in TRANSACTIONS:
        rows.append([
            Paragraph(date,    td),
            Paragraph(desc,    td),
            Paragraph(mode,    tdm),
            Paragraph(debit,   tdd if debit   else tdr),
            Paragraph(credit,  tdc if credit  else tdr),
            Paragraph(balance, tdb),
        ])

    tx_tbl = Table(rows, colWidths=col_w, repeatRows=1)

    ts = TableStyle([
        # Header row
        ("BACKGROUND",    (0, 0), (-1, 0), HDFC_BLUE),
        ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("TOPPADDING",    (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        # Data rows
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 7.5),
        ("TOPPADDING",    (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 5),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 5),
        # Grid
        ("GRID",          (0, 0), (-1, -1), 0.3, BORDER_CLR),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN",         (2, 0), (2, -1), "CENTER"),
        ("ALIGN",         (3, 0), (-1, -1), "RIGHT"),
    ])

    # Alternating row stripes
    for i in range(1, len(TRANSACTIONS) + 1):
        if i % 2 == 0:
            ts.add("BACKGROUND", (0, i), (-1, i), STRIPE_BLUE)

    tx_tbl.setStyle(ts)
    elements.append(tx_tbl)
    elements.append(Spacer(1, 0.45*cm))

    # ── 6. Summary bar ────────────────────────────────────────────────────────
    sum_rows = [
        [
            Paragraph("<b>Statement Summary</b>",
                      ParagraphStyle("ss", fontSize=8, textColor=HDFC_BLUE,
                                     fontName="Helvetica-Bold")),
            "", "", "",
        ],
        [
            Paragraph("Total Credits",  lbl),
            Paragraph("Rs. 65,120.00",
                      ParagraphStyle("sc", fontSize=8, textColor=GREEN,
                                     fontName="Helvetica-Bold")),
            Paragraph("Total Debits",   lbl),
            Paragraph("Rs. 36,621.00",
                      ParagraphStyle("sd", fontSize=8, textColor=RED_TEXT,
                                     fontName="Helvetica-Bold")),
        ],
        [
            Paragraph("No. of Credit Transactions", lbl),
            Paragraph("2",  ParagraphStyle("sn", fontSize=8, textColor=TEXT_DARK)),
            Paragraph("No. of Debit Transactions",  lbl),
            Paragraph("23", ParagraphStyle("sn", fontSize=8, textColor=TEXT_DARK)),
        ],
    ]

    cw2 = [PW * 0.25, PW * 0.25, PW * 0.25, PW * 0.25]
    sum_tbl = Table(sum_rows, colWidths=cw2)
    sum_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), HEADER_BG),
        ("SPAN",          (0, 0), (-1, 0)),
        ("ALIGN",         (0, 0), (-1, 0), "CENTER"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("BOX",           (0, 0), (-1, -1), 0.5, BORDER_CLR),
        ("LINEBELOW",     (0, 0), (-1, 0), 0.5, BORDER_CLR),
        ("LINEBELOW",     (0, 1), (-1, 1), 0.3, BORDER_CLR),
        ("LINEAFTER",     (1, 0), (1, -1), 0.5, BORDER_CLR),
    ]))
    elements.append(sum_tbl)
    elements.append(Spacer(1, 0.5*cm))

    # ── 7. Footer disclaimer ──────────────────────────────────────────────────
    elements.append(Paragraph(
        "* This is a system-generated statement and does not require a physical signature. "
        "Please report any discrepancies within 30 days of the statement date to your nearest HDFC Bank branch. "
        "HDFC Bank Ltd. is regulated by the Reserve Bank of India.   "
        "CIN: L65920MH1994PLC080618",
        ParagraphStyle("disc", fontSize=6, textColor=TEXT_GREY, leading=9),
    ))

    doc.build(elements)
    print(f"\n  PDF generated successfully!\n  Saved to: {OUTPUT_PATH}\n")


if __name__ == "__main__":
    build_pdf()
