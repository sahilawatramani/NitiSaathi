"""
PDF Report Service — Generates premium weekly/monthly financial reports.

Uses reportlab for PDF generation. Falls back to a simple HTML-to-text
summary if reportlab is not installed.
"""
from __future__ import annotations

import io
import logging
from datetime import date, timedelta
from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.schemas import UserGoal, UserProfile, UserWeeklyFeatures
from app.services.wma_service import (
    compute_full_budget_state,
    get_weekly_incomes,
    compute_income_wma_4w,
    compute_volatility,
    savings_rate_recommendation,
)

logger = logging.getLogger(__name__)

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable,
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


# ─── Color Palette ───────────────────────────────────────────────────

BRAND_PRIMARY = "#6366f1"
BRAND_SECONDARY = "#ec4899"
BRAND_SUCCESS = "#10b981"
BRAND_WARNING = "#f59e0b"
BRAND_DANGER = "#ef4444"
TEXT_DARK = "#1e293b"
TEXT_MUTED = "#64748b"
BG_LIGHT = "#f8fafc"


def generate_weekly_report_pdf(user_id: int, db: Session) -> Optional[bytes]:
    """Generate a premium weekly financial report as a PDF byte stream.

    Returns None if reportlab is not installed.
    """
    if not REPORTLAB_AVAILABLE:
        logger.warning("reportlab not installed — skipping PDF generation")
        return None

    # ── Data Collection ──────────────────────────────────────────────
    budget = compute_full_budget_state(user_id, db)
    weekly_incomes = get_weekly_incomes(user_id, db, weeks=8)
    wma = compute_income_wma_4w(weekly_incomes)
    cv = compute_volatility(weekly_incomes)
    rec_rate = savings_rate_recommendation(cv)

    latest = (
        db.query(UserWeeklyFeatures)
        .filter(UserWeeklyFeatures.user_id == user_id)
        .order_by(desc(UserWeeklyFeatures.week_start))
        .first()
    )

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    goals = (
        db.query(UserGoal)
        .filter(UserGoal.user_id == user_id, UserGoal.is_active == True)
        .all()
    )

    # ── PDF Construction ─────────────────────────────────────────────
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontSize=22,
        textColor=HexColor(BRAND_PRIMARY),
        spaceAfter=6,
        alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=HexColor(TEXT_MUTED),
        spaceAfter=20,
        alignment=TA_CENTER,
    )
    section_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=HexColor(BRAND_PRIMARY),
        spaceBefore=16,
        spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontSize=10,
        textColor=HexColor(TEXT_DARK),
        spaceAfter=6,
    )
    metric_label = ParagraphStyle(
        "MetricLabel",
        parent=styles["Normal"],
        fontSize=9,
        textColor=HexColor(TEXT_MUTED),
    )
    metric_value = ParagraphStyle(
        "MetricValue",
        parent=styles["Normal"],
        fontSize=14,
        textColor=HexColor(TEXT_DARK),
        fontName="Helvetica-Bold",
    )

    elements = []

    # ── Header ───────────────────────────────────────────────────────
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    elements.append(Paragraph("NitiSaathi", title_style))
    elements.append(Paragraph("Weekly Financial Report", subtitle_style))
    elements.append(Paragraph(
        f"{week_start.strftime('%d %b %Y')} – {week_end.strftime('%d %b %Y')}",
        subtitle_style,
    ))
    elements.append(HRFlowable(width="100%", color=HexColor(BRAND_PRIMARY), thickness=1))
    elements.append(Spacer(1, 12))

    # ── Financial Pulse ──────────────────────────────────────────────
    elements.append(Paragraph("📊 Financial Pulse", section_style))

    pulse_data = [
        ["Metric", "Value"],
        ["Income WMA (4-week)", f"₹{wma:,.0f}"],
        ["Income Volatility", f"{cv * 100:.1f}%"],
        ["Recommended Savings Rate", f"{rec_rate * 100:.0f}%"],
        ["Closing Balance", f"₹{budget.get('closing_balance', 0):,.0f}"],
        ["Safe to Spend Today", f"₹{budget.get('safe_to_spend_today', 0):,.0f}"],
        ["Low Balance Alert", "⚠️ YES" if budget.get("low_balance_flag") else "✅ No"],
    ]

    pulse_table = Table(pulse_data, colWidths=[120 * mm, 50 * mm])
    pulse_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HexColor(BRAND_PRIMARY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BACKGROUND", (0, 1), (-1, -1), HexColor(BG_LIGHT)),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#ffffff"), HexColor(BG_LIGHT)]),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
    ]))
    elements.append(pulse_table)
    elements.append(Spacer(1, 12))

    # ── Expense Breakdown ────────────────────────────────────────────
    if latest:
        elements.append(Paragraph("💸 Expense Breakdown", section_style))
        expense_data = [
            ["Category", "Amount"],
            ["Rent", f"₹{latest.exp_rent:,.0f}"],
            ["Fuel", f"₹{latest.exp_fuel:,.0f}"],
            ["Recharge", f"₹{latest.exp_recharge:,.0f}"],
            ["Food", f"₹{latest.exp_food:,.0f}"],
            ["Discretionary", f"₹{latest.exp_discretionary:,.0f}"],
            ["Family Support", f"₹{latest.exp_family_support:,.0f}"],
            ["Insurance", f"₹{latest.exp_insurance_premium:,.0f}"],
            ["Loan EMI", f"₹{latest.exp_loan_emi:,.0f}"],
            ["Total", f"₹{latest.total_expense:,.0f}"],
        ]
        exp_table = Table(expense_data, colWidths=[120 * mm, 50 * mm])
        exp_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor(BRAND_SECONDARY)),
            ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BACKGROUND", (0, 1), (-1, -1), HexColor("#ffffff")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#ffffff"), HexColor(BG_LIGHT)]),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(exp_table)
        elements.append(Spacer(1, 12))

    # ── Goals Progress ───────────────────────────────────────────────
    if goals:
        elements.append(Paragraph("🎯 Savings Goals", section_style))
        goal_data = [["Goal", "Progress", "Remaining"]]
        for g in goals:
            pct = (g.saved_amount / g.target_amount * 100) if g.target_amount > 0 else 0
            remaining = max(g.target_amount - g.saved_amount, 0)
            goal_data.append([
                g.name,
                f"₹{g.saved_amount:,.0f} / ₹{g.target_amount:,.0f} ({pct:.0f}%)",
                f"₹{remaining:,.0f}",
            ])
        goal_table = Table(goal_data, colWidths=[60 * mm, 70 * mm, 40 * mm])
        goal_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor(BRAND_SUCCESS)),
            ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BACKGROUND", (0, 1), (-1, -1), HexColor("#ffffff")),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
            ("ALIGN", (2, 0), (2, -1), "RIGHT"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(goal_table)
        elements.append(Spacer(1, 12))

    # ── Nudges ───────────────────────────────────────────────────────
    nudges = budget.get("nudges", [])
    if nudges:
        elements.append(Paragraph("💡 Smart Nudges", section_style))
        for nudge in nudges:
            elements.append(Paragraph(f"• {nudge}", body_style))
        elements.append(Spacer(1, 8))

    # ── Gamification ─────────────────────────────────────────────────
    elements.append(Paragraph("🏆 Streaks & Persona", section_style))
    persona = budget.get("financial_persona", "moderate")
    streak = budget.get("current_savings_streak", 0)
    best = budget.get("highest_savings_streak", 0)
    elements.append(Paragraph(
        f"Financial Persona: <b>{persona.title()}</b> &nbsp;|&nbsp; "
        f"Current Streak: <b>{streak} weeks</b> &nbsp;|&nbsp; "
        f"Best Streak: <b>{best} weeks</b>",
        body_style,
    ))

    # ── Footer ───────────────────────────────────────────────────────
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", color=HexColor(TEXT_MUTED), thickness=0.5))
    elements.append(Spacer(1, 6))
    footer_style = ParagraphStyle(
        "Footer", parent=styles["Normal"],
        fontSize=8, textColor=HexColor(TEXT_MUTED), alignment=TA_CENTER,
    )
    elements.append(Paragraph(
        f"Generated by NitiSaathi Budget Agent on {today.strftime('%d %b %Y')}",
        footer_style,
    ))

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    logger.info("Generated weekly PDF report for user %d (%d bytes)", user_id, len(pdf_bytes))
    return pdf_bytes


def generate_monthly_report_pdf(user_id: int, db: Session, year: int, month: int) -> Optional[bytes]:
    """Generate a monthly PDF report aggregating all weekly features for the given month."""
    if not REPORTLAB_AVAILABLE:
        logger.warning("reportlab not installed — skipping PDF generation")
        return None

    # Date range for month
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)

    weeks = (
        db.query(UserWeeklyFeatures)
        .filter(UserWeeklyFeatures.user_id == user_id)
        .filter(UserWeeklyFeatures.week_start >= start_date)
        .filter(UserWeeklyFeatures.week_start <= end_date)
        .order_by(UserWeeklyFeatures.week_start)
        .all()
    )

    total_income = sum(w.total_income for w in weeks)
    total_expense = sum(w.total_expense for w in weeks)
    avg_balance = sum(w.closing_balance for w in weeks) / len(weeks) if weeks else 0

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=15*mm, bottomMargin=15*mm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("ReportTitle", parent=styles["Heading1"], fontSize=22, textColor=HexColor(BRAND_PRIMARY), spaceAfter=6, alignment=TA_CENTER)
    subtitle_style = ParagraphStyle("ReportSubtitle", parent=styles["Normal"], fontSize=10, textColor=HexColor(TEXT_MUTED), spaceAfter=20, alignment=TA_CENTER)
    section_style = ParagraphStyle("SectionTitle", parent=styles["Heading2"], fontSize=14, textColor=HexColor(BRAND_PRIMARY), spaceBefore=16, spaceAfter=8)

    elements = []
    elements.append(Paragraph("NitiSaathi", title_style))
    elements.append(Paragraph("Monthly Financial Report", subtitle_style))
    elements.append(Paragraph(f"{start_date.strftime('%b %Y')}", subtitle_style))
    elements.append(HRFlowable(width="100%", color=HexColor(BRAND_PRIMARY), thickness=1))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("📊 Monthly Pulse", section_style))
    pulse_data = [
        ["Metric", "Value"],
        ["Total Income", f"₹{total_income:,.0f}"],
        ["Total Expense", f"₹{total_expense:,.0f}"],
        ["Average Closing Balance", f"₹{avg_balance:,.0f}"],
    ]
    pulse_table = Table(pulse_data, colWidths=[120 * mm, 50 * mm])
    pulse_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HexColor(BRAND_PRIMARY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 1), (-1, -1), HexColor(BG_LIGHT)),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
    ]))
    elements.append(pulse_table)

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_quarterly_report_pdf(user_id: int, db: Session, year: int, quarter: int) -> Optional[bytes]:
    """Quarter 1=Jan-Mar, 2=Apr-Jun, 3=Jul-Sep, 4=Oct-Dec"""
    if not REPORTLAB_AVAILABLE:
        return None
    start_month = (quarter - 1) * 3 + 1
    start_date = date(year, start_month, 1)
    if start_month + 3 > 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, start_month + 3, 1) - timedelta(days=1)

    weeks = db.query(UserWeeklyFeatures).filter(UserWeeklyFeatures.user_id == user_id, UserWeeklyFeatures.week_start >= start_date, UserWeeklyFeatures.week_start <= end_date).all()
    total_income = sum(w.total_income for w in weeks)
    total_expense = sum(w.total_expense for w in weeks)
    avg_balance = sum(w.closing_balance for w in weeks) / len(weeks) if weeks else 0

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=15*mm, bottomMargin=15*mm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("ReportTitle", parent=styles["Heading1"], fontSize=22, textColor=HexColor(BRAND_PRIMARY), spaceAfter=6, alignment=TA_CENTER)
    subtitle_style = ParagraphStyle("ReportSubtitle", parent=styles["Normal"], fontSize=10, textColor=HexColor(TEXT_MUTED), spaceAfter=20, alignment=TA_CENTER)
    section_style = ParagraphStyle("SectionTitle", parent=styles["Heading2"], fontSize=14, textColor=HexColor(BRAND_PRIMARY), spaceBefore=16, spaceAfter=8)

    elements = []
    elements.append(Paragraph("NitiSaathi", title_style))
    elements.append(Paragraph("Quarterly Financial Report", subtitle_style))
    elements.append(Paragraph(f"Q{quarter} {year}", subtitle_style))
    elements.append(HRFlowable(width="100%", color=HexColor(BRAND_PRIMARY), thickness=1))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("📊 Quarterly Pulse", section_style))
    pulse_data = [
        ["Metric", "Value"],
        ["Total Income", f"₹{total_income:,.0f}"],
        ["Total Expense", f"₹{total_expense:,.0f}"],
        ["Average Closing Balance", f"₹{avg_balance:,.0f}"],
    ]
    pulse_table = Table(pulse_data, colWidths=[120 * mm, 50 * mm])
    pulse_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), HexColor(BRAND_PRIMARY)), ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")), ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0"))]))
    elements.append(pulse_table)
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_yearly_report_pdf(user_id: int, db: Session, year: int) -> Optional[bytes]:
    """Full year — 12 month breakdown + annual totals"""
    if not REPORTLAB_AVAILABLE:
        return None
    start_date = date(year, 1, 1)
    end_date = date(year, 12, 31)

    weeks = db.query(UserWeeklyFeatures).filter(UserWeeklyFeatures.user_id == user_id, UserWeeklyFeatures.week_start >= start_date, UserWeeklyFeatures.week_start <= end_date).all()
    total_income = sum(w.total_income for w in weeks)
    total_expense = sum(w.total_expense for w in weeks)
    avg_balance = sum(w.closing_balance for w in weeks) / len(weeks) if weeks else 0

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=15*mm, bottomMargin=15*mm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("ReportTitle", parent=styles["Heading1"], fontSize=22, textColor=HexColor(BRAND_PRIMARY), spaceAfter=6, alignment=TA_CENTER)
    subtitle_style = ParagraphStyle("ReportSubtitle", parent=styles["Normal"], fontSize=10, textColor=HexColor(TEXT_MUTED), spaceAfter=20, alignment=TA_CENTER)
    section_style = ParagraphStyle("SectionTitle", parent=styles["Heading2"], fontSize=14, textColor=HexColor(BRAND_PRIMARY), spaceBefore=16, spaceAfter=8)

    elements = []
    elements.append(Paragraph("NitiSaathi", title_style))
    elements.append(Paragraph("Yearly Financial Report", subtitle_style))
    elements.append(Paragraph(f"{year}", subtitle_style))
    elements.append(HRFlowable(width="100%", color=HexColor(BRAND_PRIMARY), thickness=1))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("📊 Yearly Pulse", section_style))
    pulse_data = [
        ["Metric", "Value"],
        ["Total Income", f"₹{total_income:,.0f}"],
        ["Total Expense", f"₹{total_expense:,.0f}"],
        ["Average Closing Balance", f"₹{avg_balance:,.0f}"],
    ]
    pulse_table = Table(pulse_data, colWidths=[120 * mm, 50 * mm])
    pulse_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), HexColor(BRAND_PRIMARY)), ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")), ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0"))]))
    elements.append(pulse_table)
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_monthly_report_text_fallback(user_id: int, db: Session, year: int, month: int) -> str:
    """Text fallback when reportlab not installed"""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)

    weeks = (
        db.query(UserWeeklyFeatures)
        .filter(UserWeeklyFeatures.user_id == user_id)
        .filter(UserWeeklyFeatures.week_start >= start_date)
        .filter(UserWeeklyFeatures.week_start <= end_date)
        .all()
    )

    total_income = sum(w.total_income for w in weeks)
    total_expense = sum(w.total_expense for w in weeks)
    avg_balance = sum(w.closing_balance for w in weeks) / len(weeks) if weeks else 0

    lines = [
        "═══════════════════════════════════════",
        "  NitiSaathi — Monthly Financial Report",
        "═══════════════════════════════════════",
        "",
        f"  Total Income:              ₹{total_income:,.0f}",
        f"  Total Expense:             ₹{total_expense:,.0f}",
        f"  Average Closing Balance:   ₹{avg_balance:,.0f}",
        "═══════════════════════════════════════"
    ]
    return "\n".join(lines)


def generate_report_text_fallback(user_id: int, db: Session) -> str:
    """Plain-text fallback report when reportlab is not available."""
    budget = compute_full_budget_state(user_id, db)
    weekly_incomes = get_weekly_incomes(user_id, db, weeks=8)
    wma = compute_income_wma_4w(weekly_incomes)
    cv = compute_volatility(weekly_incomes)
    rec_rate = savings_rate_recommendation(cv)

    lines = [
        "═══════════════════════════════════════",
        "  NitiSaathi — Weekly Financial Report",
        "═══════════════════════════════════════",
        "",
        f"  Income WMA (4-week):       ₹{wma:,.0f}",
        f"  Income Volatility:         {cv * 100:.1f}%",
        f"  Recommended Savings Rate:  {rec_rate * 100:.0f}%",
        f"  Closing Balance:           ₹{budget.get('closing_balance', 0):,.0f}",
        f"  Safe to Spend Today:       ₹{budget.get('safe_to_spend_today', 0):,.0f}",
        f"  Low Balance Alert:         {'⚠️ YES' if budget.get('low_balance_flag') else '✅ No'}",
        "",
        f"  Persona: {budget.get('financial_persona', 'moderate').title()}",
        f"  Savings Streak: {budget.get('current_savings_streak', 0)} weeks",
        "",
    ]

    nudges = budget.get("nudges", [])
    if nudges:
        lines.append("  💡 Nudges:")
        for n in nudges:
            lines.append(f"    • {n}")
        lines.append("")

    lines.append("═══════════════════════════════════════")
    return "\n".join(lines)
