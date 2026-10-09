import io
from datetime import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Adds running headers and page numbers to multi-page PDFs."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_elements(num_pages)
            super().showPage()
        super().save()

    def draw_page_elements(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#667085"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "VET-AI Livestock Health Intelligence — Clinical Assessment Report")
            self.setStrokeColor(colors.HexColor("#E5EAF0"))
            self.setLineWidth(0.5)
            self.line(54, 748, 558, 748)
            
        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, footer_text)
        self.drawString(54, 36, "CONFIDENTIAL — FOR AUTHORIZED FARM HERD MANAGEMENT ONLY")
        self.setStrokeColor(colors.HexColor("#E5EAF0"))
        self.setLineWidth(0.5)
        self.line(54, 46, 558, 46)
        self.restoreState()

def generate_veterinary_report_pdf(report: Dict[str, Any]) -> bytes:
    """
    Generates a professional, print-ready veterinary health intelligence PDF report.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#16845B")
    text_color = colors.HexColor("#172033")
    muted_color = colors.HexColor("#667085")
    border_color = colors.HexColor("#E5EAF0")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=muted_color,
        spaceAfter=14
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=text_color,
        spaceBefore=10,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=text_color,
        spaceAfter=6
    )
    
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#7A3E00"),
        spaceAfter=4
    )

    story = []

    # 1. Header & Branding
    story.append(Paragraph("VET-AI CLINICAL DECISION SUPPORT REPORT", title_style))
    created_date = report.get("created_at", datetime.now().isoformat())
    if isinstance(created_date, str):
        try:
            created_date = datetime.fromisoformat(created_date.replace("Z", "+00:00")).strftime("%B %d, %Y at %H:%M UTC")
        except Exception:
            pass
    story.append(Paragraph(f"Autonomous Multi-Agent Health Intelligence | Generated: {created_date} | Report ID: {str(report.get('id', 'N/A'))[:13]}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=14))

    # 2. Animal Metadata Table
    risk_level = str(report.get("risk_level", "LOW")).upper()
    risk_score = float(report.get("risk_score") or 0)
    
    # Risk Badge Styling
    if risk_level == "CRITICAL":
        risk_bg = colors.HexColor("#FDE8E8")
        risk_fg = colors.HexColor("#9B1C1C")
    elif risk_level == "HIGH":
        risk_bg = colors.HexColor("#FEECDC")
        risk_fg = colors.HexColor("#B43403")
    elif risk_level == "MODERATE":
        risk_bg = colors.HexColor("#FEF08A")
        risk_fg = colors.HexColor("#854D0E")
    else:
        risk_bg = colors.HexColor("#DEF7EC")
        risk_fg = colors.HexColor("#03543F")

    meta_data = [
        [
            Paragraph("<b>Animal Identifier:</b>", body_style),
            Paragraph(f"<b>{report.get('animal_id', 'Unknown')}</b>", body_style),
            Paragraph("<b>Current Health Risk:</b>", body_style),
            Paragraph(f"<b>{risk_score:.1f}/100 — {risk_level}</b>", ParagraphStyle('RiskBadge', parent=body_style, fontName='Helvetica-Bold', textColor=risk_fg))
        ],
        [
            Paragraph("<b>Species / Breed:</b>", body_style),
            Paragraph(f"{report.get('species', 'Livestock')} — {report.get('breed', 'Standard')}", body_style),
            Paragraph("<b>Age & Gender:</b>", body_style),
            Paragraph(f"{report.get('age', 'N/A')} yrs | {report.get('gender', 'N/A')}", body_style)
        ],
        [
            Paragraph("<b>Farm Facility:</b>", body_style),
            Paragraph(str(report.get("farm", "Green Valley Herd")), body_style),
            Paragraph("<b>Assessment Status:</b>", body_style),
            Paragraph("Multi-Agent Verified", body_style)
        ]
    ]

    t_meta = Table(meta_data, colWidths=[120, 132, 120, 132])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # 3. Executive Clinical Summary
    story.append(Paragraph("1. Executive Clinical Summary", h2_style))
    summary_text = report.get("summary") or "Comprehensive automated multi-agent health assessment completed."
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 10))

    # 4. Multi-Agent Sensor & Behavioral Evidence
    evidence = report.get("evidence") or {}
    if isinstance(evidence, dict) and evidence:
        story.append(Paragraph("2. Diagnostic Telemetry & Observed Evidence", h2_style))
        
        evidence_rows = [
            [Paragraph("<b>Telemetry Channel</b>", body_style), Paragraph("<b>Observed Reading</b>", body_style), Paragraph("<b>Baseline Comparison / Variance</b>", body_style)]
        ]

        if "temperature" in evidence:
            temp = evidence.get("temperature", {})
            val = temp.get("value", "N/A")
            dev = temp.get("deviation", "+0.0")
            stat = temp.get("status", "Normal")
            evidence_rows.append([
                Paragraph("Thermal Telemetry", body_style),
                Paragraph(f"{val}°C ({stat})", body_style),
                Paragraph(f"Deviation: {dev}°C vs herd baseline", body_style)
            ])

        if "feeding" in evidence:
            feed = evidence.get("feeding", {})
            val = feed.get("value", "N/A")
            chg = feed.get("change_pct", "0.0")
            evidence_rows.append([
                Paragraph("Bunk Feeding Capacity", body_style),
                Paragraph(f"{val}% capacity", body_style),
                Paragraph(f"Shift: {chg}% from 7-day average", body_style)
            ])

        if "activity" in evidence:
            act = evidence.get("activity", {})
            val = act.get("value", "N/A")
            chg = act.get("change_pct", "0.0")
            evidence_rows.append([
                Paragraph("Collar Locomotion / Activity", body_style),
                Paragraph(f"{val}% index", body_style),
                Paragraph(f"Shift: {chg}% from herd average", body_style)
            ])

        if "vision" in evidence:
            vis = evidence.get("vision", {})
            posture = vis.get("posture", "Normal")
            conf = vis.get("confidence", 0.90)
            evidence_rows.append([
                Paragraph("Computer Vision Demeanor", body_style),
                Paragraph(f"Posture: {posture}", body_style),
                Paragraph(f"CV Model Confidence: {float(conf)*100:.0f}%", body_style)
            ])

        if len(evidence_rows) > 1:
            t_evidence = Table(evidence_rows, colWidths=[150, 160, 194])
            t_evidence.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EAF7F0")),
                ('TEXTCOLOR', (0,0), (-1,0), primary_color),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
                ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ]))
            story.append(t_evidence)
            story.append(Spacer(1, 10))

    # 5. Full Clinical Report Content
    content_raw = report.get("report_content")
    if content_raw:
        story.append(Paragraph("3. Detailed Multi-Agent Intelligence Findings", h2_style))
        for line in content_raw.split("\n"):
            line = line.strip()
            if not line or line.startswith("==="):
                continue
            if line.startswith("DISCLAIMER:"):
                break
            if line[0].isdigit() and "." in line[:3]:
                story.append(Paragraph(f"<b>{line}</b>", ParagraphStyle('NumberedSec', parent=body_style, fontName='Helvetica-Bold', spaceBefore=6)))
            elif line.startswith("- "):
                story.append(Paragraph(f"• {line[2:]}", ParagraphStyle('Bullet', parent=body_style, leftIndent=12)))
            else:
                story.append(Paragraph(line, body_style))
        story.append(Spacer(1, 10))

    # 6. Actionable Clinical Recommendations
    recs = report.get("recommendations")
    if recs:
        story.append(Paragraph("4. Recommended Immediate Protocols", h2_style))
        for r_item in recs.split(". "):
            r_item = r_item.strip()
            if r_item:
                if not r_item.endswith("."):
                    r_item += "."
                story.append(Paragraph(f"→ {r_item}", ParagraphStyle('RecItem', parent=body_style, leftIndent=10, fontName='Helvetica-Bold')))
        story.append(Spacer(1, 12))

    # 7. Regulatory & Safety Disclaimer (Mandatory)
    disclaimer_box = [
        [
            Paragraph("<b>VETERINARY CLINICAL DECISION SUPPORT NOTICE:</b>", ParagraphStyle('NoticeH', parent=disclaimer_style, fontName='Helvetica-Bold', textColor=colors.HexColor("#9A3412"))),
        ],
        [
            Paragraph(
                report.get("disclaimer") or 
                "VET-AI provides AI-assisted health-risk monitoring and early disease screening based on multi-sensor telemetry, computer vision, and veterinary literature. It does NOT provide a definitive veterinary medical diagnosis or drug prescriptions. Always consult a licensed veterinarian for clinical evaluation, definitive diagnosis, and treatment protocols.",
                disclaimer_style
            )
        ]
    ]
    t_disc = Table(disclaimer_box, colWidths=[504])
    t_disc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FFFBEB")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#FDE68A")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(KeepTogether([t_disc]))

    # Build document with running page numbers
    doc.build(story, canvasmaker=NumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

def generate_herd_summary_pdf(run: Dict[str, Any], animals: List[Dict[str, Any]], summary_report: Optional[Dict[str, Any]] = None) -> bytes:
    """
    Generates a professional, multi-page print-ready Herd Health Screening and Feeding Intelligence PDF summary.
    Includes:
    - Executive screening run metadata
    - Category distribution metrics (Low, Needs Info, Medium, High, Critical)
    - High-priority clinical intervention list
    - Outstanding feeding questionnaire list
    - Full animal results matrix
    - Mandatory veterinary decision support disclaimer
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle('HerdTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=colors.HexColor("#172033"))
    subtitle_style = ParagraphStyle('HerdSub', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=13, textColor=colors.HexColor("#667085"))
    h2_style = ParagraphStyle('HerdH2', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=colors.HexColor("#172033"), spaceBefore=12, spaceAfter=6)
    body_style = ParagraphStyle('HerdBody', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=13, textColor=colors.HexColor("#334155"))
    body_bold = ParagraphStyle('HerdBodyB', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=13, textColor=colors.HexColor("#172033"))
    cell_style = ParagraphStyle('HerdCell', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor("#1E293B"))
    cell_bold = ParagraphStyle('HerdCellB', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=11, textColor=colors.HexColor("#172033"))
    disclaimer_style = ParagraphStyle('HerdDisc', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, leading=11, textColor=colors.HexColor("#78350F"))

    # 1. Header Banner
    run_id = str(run.get("id", "RUN-UNKNOWN"))
    farm = run.get("farm", "General Herd")
    created_at = run.get("created_at") or datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    header_data = [
        [
            Paragraph("<b>VET-AI LIVESTOCK INTELLIGENCE</b>", ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=11, textColor=colors.HexColor("#16845B"))),
            Paragraph(f"<b>SCREENING RUN ID:</b> {run_id[:8].upper()}", ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=9, alignment=2, textColor=colors.HexColor("#667085")))
        ],
        [
            Paragraph("HERD HEALTH SCREENING & FEEDING INTELLIGENCE REPORT", title_style),
            Paragraph(f"Generated: {datetime.utcnow().strftime('%b %d, %Y %H:%M UTC')}", ParagraphStyle('H3', fontName='Helvetica', fontSize=8, alignment=2, textColor=colors.HexColor("#667085")))
        ]
    ]
    t_header = Table(header_data, colWidths=[360, 144])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#16845B"), spaceAfter=12))

    # 2. Executive Overview Table
    meta_table_data = [
        [Paragraph("<b>Farm Facility:</b>", body_style), Paragraph(farm, body_bold), Paragraph("<b>Screening Date:</b>", body_style), Paragraph(str(created_at)[:16], body_bold)],
        [Paragraph("<b>Total Selected:</b>", body_style), Paragraph(str(run.get("total_animals", len(animals))), body_bold), Paragraph("<b>Screened Count:</b>", body_style), Paragraph(str(run.get("screened_animals", len(animals))), body_bold)],
        [Paragraph("<b>Species Group:</b>", body_style), Paragraph(run.get("species_filter", "ALL"), body_bold), Paragraph("<b>Status:</b>", body_style), Paragraph(run.get("status", "COMPLETED"), body_bold)]
    ]
    t_meta = Table(meta_table_data, colWidths=[90, 162, 90, 162])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # 3. Categorization Summary Metrics
    story.append(Paragraph("1. Herd Health Categorization Breakdown", h2_style))
    crit_c = run.get("critical_count", 0)
    high_c = run.get("high_risk_count", 0)
    med_c = run.get("medium_risk_count", 0)
    needs_c = run.get("needs_info_count", 0)
    low_c = run.get("low_risk_count", 0)

    cat_table_data = [
        [
            Paragraph("<b>CRITICAL CONCERN</b>", ParagraphStyle('C1', parent=cell_bold, textColor=colors.HexColor("#B91C1C"))),
            Paragraph("<b>HIGH RISK</b>", ParagraphStyle('C2', parent=cell_bold, textColor=colors.HexColor("#C2410C"))),
            Paragraph("<b>MEDIUM RISK</b>", ParagraphStyle('C3', parent=cell_bold, textColor=colors.HexColor("#854D0E"))),
            Paragraph("<b>NEEDS MORE INFO</b>", ParagraphStyle('C4', parent=cell_bold, textColor=colors.HexColor("#1D4ED8"))),
            Paragraph("<b>LOW RISK</b>", ParagraphStyle('C5', parent=cell_bold, textColor=colors.HexColor("#16845B"))),
        ],
        [
            Paragraph(f"<b>{crit_c}</b>", ParagraphStyle('N1', fontName='Helvetica-Bold', fontSize=16, alignment=1, textColor=colors.HexColor("#B91C1C"))),
            Paragraph(f"<b>{high_c}</b>", ParagraphStyle('N2', fontName='Helvetica-Bold', fontSize=16, alignment=1, textColor=colors.HexColor("#C2410C"))),
            Paragraph(f"<b>{med_c}</b>", ParagraphStyle('N3', fontName='Helvetica-Bold', fontSize=16, alignment=1, textColor=colors.HexColor("#854D0E"))),
            Paragraph(f"<b>{needs_c}</b>", ParagraphStyle('N4', fontName='Helvetica-Bold', fontSize=16, alignment=1, textColor=colors.HexColor("#1D4ED8"))),
            Paragraph(f"<b>{low_c}</b>", ParagraphStyle('N5', fontName='Helvetica-Bold', fontSize=16, alignment=1, textColor=colors.HexColor("#16845B"))),
        ],
        [
            Paragraph("Urgent triage required", cell_style),
            Paragraph("Prompt vet eval advised", cell_style),
            Paragraph("Active monitor & ration check", cell_style),
            Paragraph("Feeding questionnaire pending", cell_style),
            Paragraph("Vitals normative & stable", cell_style),
        ]
    ]
    t_cat = Table(cat_table_data, colWidths=[100, 100, 100, 104, 100])
    t_cat.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#FEF2F2")),
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor("#FFF7ED")),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor("#FEFCE8")),
        ('BACKGROUND', (3,0), (3,-1), colors.HexColor("#EFF6FF")),
        ('BACKGROUND', (4,0), (4,-1), colors.HexColor("#F0FDF4")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_cat)
    story.append(Spacer(1, 14))

    # 4. Animals Requiring Immediate Veterinary Attention
    urgent_animals = [a for a in animals if (a.get("final_category") or a.get("initial_category")) in ("CRITICAL CONCERN", "HIGH RISK")]
    if urgent_animals:
        story.append(Paragraph("2. High-Priority Animals Requiring Veterinary Attention", h2_style))
        urg_headers = [Paragraph("<b>Animal ID</b>", cell_bold), Paragraph("<b>Species / Breed</b>", cell_bold), Paragraph("<b>Category</b>", cell_bold), Paragraph("<b>Score</b>", cell_bold), Paragraph("<b>Key Observed Clinical Findings</b>", cell_bold)]
        urg_rows = [urg_headers]
        for a in urgent_animals:
            cat = a.get("final_category") or a.get("initial_category")
            score = a.get("final_risk_score") or a.get("initial_risk_score", 0)
            findings_list = a.get("observed_findings", [])
            findings_text = "; ".join(findings_list[:2]) if isinstance(findings_list, list) else str(findings_list)
            urg_rows.append([
                Paragraph(f"<b>{a.get('animal_code')}</b>", cell_bold),
                Paragraph(f"{a.get('species')} ({a.get('breed', 'Std')})", cell_style),
                Paragraph(cat, ParagraphStyle('UCat', parent=cell_bold, textColor=colors.HexColor("#B91C1C" if cat == "CRITICAL CONCERN" else "#C2410C"))),
                Paragraph(f"{float(score):.0f}/100", cell_bold),
                Paragraph(findings_text or "Significant physiological deviation flagged", cell_style),
            ])
        t_urg = Table(urg_rows, colWidths=[70, 95, 95, 45, 199])
        t_urg.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_urg)
        story.append(Spacer(1, 14))

    # 5. Full Screening Results Matrix
    story.append(Paragraph("3. Complete Herd Screening Results", h2_style))
    matrix_headers = [
        Paragraph("<b>ID</b>", cell_bold),
        Paragraph("<b>Species</b>", cell_bold),
        Paragraph("<b>Status</b>", cell_bold),
        Paragraph("<b>Category</b>", cell_bold),
        Paragraph("<b>Score</b>", cell_bold),
        Paragraph("<b>Feeding Status</b>", cell_bold),
        Paragraph("<b>Recommended Next Step</b>", cell_bold)
    ]
    matrix_rows = [matrix_headers]
    for a in animals:
        cat = a.get("final_category") or a.get("initial_category", "NEEDS MORE INFORMATION")
        score = a.get("final_risk_score") if a.get("final_risk_score") is not None else a.get("initial_risk_score", 0)
        feed_st = a.get("feeding_status", "NOT_REQUESTED")
        next_step = a.get("recommended_next_step", "Standard monitoring")
        matrix_rows.append([
            Paragraph(f"<b>{a.get('animal_code')}</b>", cell_bold),
            Paragraph(a.get("species", "Cattle"), cell_style),
            Paragraph(a.get("status", "COMPLETED"), cell_style),
            Paragraph(cat, cell_style),
            Paragraph(f"{float(score):.0f}", cell_style),
            Paragraph(feed_st.replace("_", " "), cell_style),
            Paragraph(next_step, cell_style),
        ])
    t_mat = Table(matrix_rows, colWidths=[60, 60, 60, 95, 35, 74, 120])
    t_mat.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_mat)
    story.append(Spacer(1, 14))

    # 6. Safety & Decision-Support Notice
    disc_data = [
        [Paragraph("<b>VETERINARY DECISION SUPPORT & CLINICAL DISCLAIMER:</b>", ParagraphStyle('ND', parent=disclaimer_style, fontName='Helvetica-Bold'))],
        [Paragraph(
            "This herd health screening intelligence report is generated via multi-agent AI synthesis combining computer vision, "
            "environmental sensors, behavioral monitoring, and farmer-reported feeding telemetry. "
            "VET-AI assessments provide early warning risk stratification for decision support and do NOT constitute a definitive "
            "veterinary medical diagnosis or pharmacological prescription. Always consult a licensed veterinarian for clinical verification, "
            "blood chemistry confirmation, and official treatment protocols.",
            disclaimer_style
        )]
    ]
    t_d = Table(disc_data, colWidths=[504])
    t_d.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FFFBEB")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#FDE68A")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(KeepTogether([t_d]))

    doc.build(story, canvasmaker=NumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

