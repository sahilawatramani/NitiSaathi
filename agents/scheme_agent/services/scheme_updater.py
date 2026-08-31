"""
Automated Scheme Data Updater

Scheduled service to check scheme data freshness and flag stale information.
In production, this would:
1. Scrape official government portals for scheme updates
2. Compare with local knowledge base
3. Flag discrepancies
4. Generate update report
5. Send alert if critical schemes are outdated

For now, implements the framework and staleness checking logic.
"""
import json
import logging
from pathlib import Path
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass
import asyncio


@dataclass
class SchemeUpdateRecord:
    """Record of scheme update check"""
    scheme_code: str
    scheme_name: str
    last_verified: date
    days_since_update: int
    is_stale: bool
    recommended_action: str
    check_sources: List[str]


class SchemeDataUpdater:
    """
    Automated scheme data updater service
    
    Runs as scheduled job to:
    - Check data freshness
    - Flag stale schemes
    - Generate update recommendations
    - Log update history
    """
    
    def __init__(
        self,
        knowledge_base_path: str = None,
        staleness_threshold_days: int = 90,
        critical_threshold_days: int = 180
    ):
        """
        Initialize updater
        
        Args:
            knowledge_base_path: Path to schemes_kb.json
            staleness_threshold_days: Days before scheme data is considered stale
            critical_threshold_days: Days before scheme data is critically outdated
        """
        if knowledge_base_path is None:
            self.kb_path = Path(__file__).parent.parent / "data" / "schemes_kb.json"
        else:
            self.kb_path = Path(knowledge_base_path)
        
        self.staleness_threshold = staleness_threshold_days
        self.critical_threshold = critical_threshold_days
        
        self.logger = logging.getLogger(__name__)
        
        # Update log path
        self.update_log_path = self.kb_path.parent / "scheme_update_log.json"
        
        # Official source URLs for manual verification
        self.official_sources = {
            "e_shram": [
                "https://www.eshram.gov.in/",
                "https://labour.gov.in/e-shram"
            ],
            "pm_sym": [
                "https://maandhan.in/",
                "https://labour.gov.in/pm-sym"
            ],
            "pmsby": [
                "https://jansuraksha.gov.in/",
                "https://www.india.gov.in/spotlight/pradhan-mantri-suraksha-bima-yojana"
            ],
            "pmjjby": [
                "https://jansuraksha.gov.in/",
                "https://www.india.gov.in/spotlight/pradhan-mantri-jeevan-jyoti-bima-yojana"
            ],
            "apy": [
                "https://npscra.nsdl.co.in/atal-pension.php",
                "https://www.india.gov.in/spotlight/atal-pension-yojana"
            ],
            "state_welfare_boards": [
                "State labour department portals (varies by state)"
            ]
        }
    
    def load_knowledge_base(self) -> Dict:
        """Load current knowledge base"""
        with open(self.kb_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def save_knowledge_base(self, kb: Dict):
        """Save updated knowledge base"""
        with open(self.kb_path, 'w', encoding='utf-8') as f:
            json.dump(kb, f, indent=2, ensure_ascii=False)
    
    def check_freshness(self) -> Dict:
        """
        Check freshness of all schemes in knowledge base
        
        Returns:
            Dict with stale schemes and recommendations
        """
        kb = self.load_knowledge_base()
        today = date.today()
        
        update_records = []
        stale_schemes = []
        critical_schemes = []
        
        for scheme_key, scheme_data in kb["schemes"].items():
            if not isinstance(scheme_data, dict) or "last_verified" not in scheme_data:
                continue
            
            last_verified = date.fromisoformat(scheme_data["last_verified"])
            days_old = (today - last_verified).days
            
            is_stale = days_old > self.staleness_threshold
            is_critical = days_old > self.critical_threshold
            
            if is_stale:
                stale_schemes.append(scheme_key)
            
            if is_critical:
                critical_schemes.append(scheme_key)
            
            # Determine recommended action
            if is_critical:
                action = f"URGENT: Update required (data is {days_old} days old)"
            elif is_stale:
                action = f"Recommend update (data is {days_old} days old)"
            else:
                action = "No update needed (data is fresh)"
            
            record = SchemeUpdateRecord(
                scheme_code=scheme_key,
                scheme_name=scheme_data.get("full_name", scheme_key),
                last_verified=last_verified,
                days_since_update=days_old,
                is_stale=is_stale,
                recommended_action=action,
                check_sources=self.official_sources.get(scheme_key, [])
            )
            
            update_records.append(record)
        
        # Generate summary
        summary = {
            "check_timestamp": datetime.now().isoformat(),
            "total_schemes_checked": len(update_records),
            "stale_schemes_count": len(stale_schemes),
            "critical_schemes_count": len(critical_schemes),
            "staleness_threshold_days": self.staleness_threshold,
            "critical_threshold_days": self.critical_threshold,
            "stale_schemes": stale_schemes,
            "critical_schemes": critical_schemes,
            "update_records": [
                {
                    "scheme_code": r.scheme_code,
                    "scheme_name": r.scheme_name,
                    "last_verified": str(r.last_verified),
                    "days_since_update": r.days_since_update,
                    "is_stale": r.is_stale,
                    "recommended_action": r.recommended_action,
                    "check_sources": r.check_sources
                }
                for r in update_records
            ],
            "recommendation": self._generate_recommendation(len(stale_schemes), len(critical_schemes))
        }
        
        # Log the check
        self._log_update_check(summary)
        
        return summary
    
    def _generate_recommendation(self, stale_count: int, critical_count: int) -> str:
        """Generate human-readable recommendation"""
        if critical_count > 0:
            return (
                f"CRITICAL: {critical_count} scheme(s) have not been verified in over "
                f"{self.critical_threshold} days. Manual verification against official "
                f"sources is REQUIRED before continuing to use this data for user recommendations."
            )
        elif stale_count > 0:
            return (
                f"WARNING: {stale_count} scheme(s) have not been verified in over "
                f"{self.staleness_threshold} days. Recommend checking official sources "
                f"for any policy changes, contribution updates, or eligibility modifications."
            )
        else:
            return "All scheme data is up to date. No action required."
    
    def _log_update_check(self, summary: Dict):
        """Log update check to persistent log file"""
        log_entry = {
            "timestamp": summary["check_timestamp"],
            "stale_count": summary["stale_schemes_count"],
            "critical_count": summary["critical_schemes_count"],
            "stale_schemes": summary["stale_schemes"],
            "critical_schemes": summary["critical_schemes"]
        }
        
        # Load existing log
        if self.update_log_path.exists():
            with open(self.update_log_path, 'r', encoding='utf-8') as f:
                log_data = json.load(f)
        else:
            log_data = {"checks": []}
        
        # Append new entry
        log_data["checks"].append(log_entry)
        
        # Keep only last 100 checks
        log_data["checks"] = log_data["checks"][-100:]
        
        # Save log
        with open(self.update_log_path, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2)
        
        self.logger.info(f"Update check logged: {summary['stale_schemes_count']} stale, {summary['critical_schemes_count']} critical")
    
    def mark_scheme_verified(self, scheme_code: str, verification_date: str = None) -> bool:
        """
        Mark a scheme as verified (manual update after checking official sources)
        
        Args:
            scheme_code: Scheme to mark as verified
            verification_date: Date of verification (defaults to today)
        
        Returns:
            True if successful, False if scheme not found
        """
        kb = self.load_knowledge_base()
        
        if scheme_code not in kb["schemes"]:
            self.logger.error(f"Scheme '{scheme_code}' not found in knowledge base")
            return False
        
        verify_date = verification_date if verification_date else date.today().isoformat()
        
        # Update last_verified date
        kb["schemes"][scheme_code]["last_verified"] = verify_date
        
        # Update knowledge base last_updated timestamp
        kb["last_updated"] = date.today().isoformat()
        
        # Save
        self.save_knowledge_base(kb)
        
        self.logger.info(f"Scheme '{scheme_code}' marked as verified on {verify_date}")
        return True
    
    def generate_update_report(self, output_path: Optional[Path] = None) -> str:
        """
        Generate detailed update report
        
        Args:
            output_path: Path to save report (defaults to data/scheme_update_report.txt)
        
        Returns:
            Report text
        """
        freshness_check = self.check_freshness()
        
        report_lines = [
            "=" * 80,
            "SCHEME DATA FRESHNESS REPORT",
            "=" * 80,
            f"Generated: {freshness_check['check_timestamp']}",
            f"Staleness Threshold: {self.staleness_threshold} days",
            f"Critical Threshold: {self.critical_threshold} days",
            "",
            f"Total Schemes Checked: {freshness_check['total_schemes_checked']}",
            f"Stale Schemes: {freshness_check['stale_schemes_count']}",
            f"Critical Schemes: {freshness_check['critical_schemes_count']}",
            "",
            "RECOMMENDATION:",
            freshness_check['recommendation'],
            "",
            "=" * 80,
            "SCHEME DETAILS:",
            "=" * 80,
            ""
        ]
        
        for record in freshness_check['update_records']:
            status_icon = "✗" if record['is_stale'] else "✓"
            report_lines.extend([
                f"{status_icon} {record['scheme_name']}",
                f"   Scheme Code: {record['scheme_code']}",
                f"   Last Verified: {record['last_verified']} ({record['days_since_update']} days ago)",
                f"   Action: {record['recommended_action']}",
                f"   Sources to check:",
            ])
            
            for source in record['check_sources']:
                report_lines.append(f"      - {source}")
            
            report_lines.append("")
        
        report_lines.extend([
            "=" * 80,
            "MANUAL UPDATE INSTRUCTIONS:",
            "=" * 80,
            "",
            "To mark a scheme as verified after checking official sources:",
            "1. Visit the official source URLs listed above",
            "2. Verify scheme details (eligibility, contribution, benefits)",
            "3. Update schemes_kb.json if any changes found",
            "4. Run: updater.mark_scheme_verified('scheme_code')",
            "",
            "Or via API:",
            "POST /api/v1/schemes/mark-verified",
            '{"scheme_code": "pm_sym", "verified_by": "admin", "notes": "Verified on official portal"}',
            ""
        ])
        
        report_text = "\n".join(report_lines)
        
        # Save to file if path provided
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(report_text)
            self.logger.info(f"Report saved to {output_path}")
        else:
            # Default path
            default_path = self.kb_path.parent / "scheme_update_report.txt"
            with open(default_path, 'w', encoding='utf-8') as f:
                f.write(report_text)
            self.logger.info(f"Report saved to {default_path}")
        
        return report_text
    
    async def automated_check_job(self, interval_hours: int = 24):
        """
        Run automated freshness check as background job
        
        Args:
            interval_hours: Hours between checks (default: 24 hours)
        """
        self.logger.info(f"Starting automated scheme freshness checker (every {interval_hours} hours)")
        
        while True:
            try:
                self.logger.info("Running scheduled scheme freshness check...")
                summary = self.check_freshness()
                
                # Generate report if there are stale or critical schemes
                if summary['stale_schemes_count'] > 0 or summary['critical_schemes_count'] > 0:
                    self.generate_update_report()
                    self.logger.warning(
                        f"Freshness check alert: {summary['stale_schemes_count']} stale, "
                        f"{summary['critical_schemes_count']} critical schemes"
                    )
                else:
                    self.logger.info("All schemes are up to date")
                
            except Exception as e:
                self.logger.error(f"Error in automated check job: {str(e)}")
            
            # Wait for next interval
            await asyncio.sleep(interval_hours * 3600)


# Convenience function for use in FastAPI startup
def create_updater_job(
    knowledge_base_path: str = None,
    staleness_threshold: int = 90,
    check_interval_hours: int = 24
) -> SchemeDataUpdater:
    """
    Create and return configured updater instance
    
    Usage in FastAPI:
    ```python
    @app.on_event("startup")
    async def startup_event():
        updater = create_updater_job()
        asyncio.create_task(updater.automated_check_job())
    ```
    """
    updater = SchemeDataUpdater(
        knowledge_base_path=knowledge_base_path,
        staleness_threshold_days=staleness_threshold
    )
    
    # Run initial check
    summary = updater.check_freshness()
    logging.info(f"Initial scheme freshness check: {summary['stale_schemes_count']} stale schemes")
    
    return updater
