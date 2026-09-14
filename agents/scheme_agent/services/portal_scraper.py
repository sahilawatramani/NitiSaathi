"""
Portal Scraper Service — Isolated Offline / Batch Scheme Enrichment

Scrapes public official government portals and writes discovery snapshots
to a separate staging file (`schemes_scraped_staging.json`).
Never directly modifies `schemes_kb.json` to guarantee 100% demo reliability.
"""
import asyncio
import json
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import httpx

logger = logging.getLogger("scheme_agent.scraper")

TARGET_PORTALS = [
    {
        "portal_name": "e-Shram National Portal",
        "url": "https://eshram.gov.in/",
        "target_scheme": "e_shram",
        "category": "identity",
    },
    {
        "portal_name": "Jan Suraksha Portal (PMSBY & PMJJBY)",
        "url": "https://jansuraksha.gov.in/",
        "target_scheme": "pmsby",
        "category": "insurance_healthcare",
    },
    {
        "portal_name": "Pradhan Mantri Shram Yogi Maan-Dhan Portal",
        "url": "https://maandhan.in/",
        "target_scheme": "pm_sym",
        "category": "pension_retirement",
    },
    {
        "portal_name": "Ayushman Bharat PM-JAY",
        "url": "https://pmjay.gov.in/",
        "target_scheme": "pm_jay",
        "category": "insurance_healthcare",
    },
    {
        "portal_name": "PM SVANidhi Micro-Credit Portal",
        "url": "https://pmsvanidhi.mohua.gov.in/",
        "target_scheme": "pm_svanidhi",
        "category": "credit_loan",
    },
    {
        "portal_name": "Karnataka Gig Workers Board",
        "url": "https://kswfc.karnataka.gov.in/",
        "target_scheme": "state_gig_karnataka",
        "category": "state_welfare_board",
    },
]


class PortalScraperService:
    def __init__(self, staging_path: Optional[str] = None):
        if staging_path is None:
            self.staging_path = Path(__file__).parent.parent / "data" / "schemes_scraped_staging.json"
        else:
            self.staging_path = Path(staging_path)

        self.last_scrape_status: Dict = {
            "status": "idle",
            "last_run": None,
            "portals_scanned": 0,
            "items_discovered": 0,
            "errors_logged": 0,
        }

    async def scrape_portal(self, portal_info: dict, client: httpx.AsyncClient) -> dict:
        """
        Safely fetch and extract metadata from an official portal.
        Never throws an unhandled exception.
        """
        name = portal_info["portal_name"]
        url = portal_info["url"]
        scheme_key = portal_info["target_scheme"]

        result = {
            "portal_name": name,
            "url": url,
            "scheme_key": scheme_key,
            "category": portal_info.get("category", "general"),
            "status": "failed",
            "extracted_title": None,
            "keywords_found": [],
            "http_status": None,
            "scraped_at": datetime.now().isoformat(),
            "notes": None,
        }

        try:
            response = await client.get(url, timeout=6.0, follow_redirects=True)
            result["http_status"] = response.status_code

            if response.status_code == 200:
                html_text = response.text
                result["status"] = "success"

                # Extract title
                title_match = re.search(r"<title[^>]*>(.*?)</title>", html_text, re.IGNORECASE | re.DOTALL)
                if title_match:
                    clean_title = re.sub(r"\s+", " ", title_match.group(1)).strip()
                    result["extracted_title"] = clean_title

                # Extract keywords
                keywords = set()
                search_terms = [
                    "gig", "worker", "insurance", "pension", "bima", "yojana",
                    "subsidy", "welfare", "accidental", "uan", "aadhaar", "eshram",
                    "svanidhi", "ayushman", "suraksha", "maan-dhan", "loan"
                ]
                lower_html = html_text.lower()
                for term in search_terms:
                    if term in lower_html:
                        keywords.add(term)

                result["keywords_found"] = sorted(list(keywords))
                result["notes"] = f"Successfully crawled {name}. Extracted {len(keywords)} relevant keywords."
            else:
                result["notes"] = f"HTTP {response.status_code} returned by portal."

        except httpx.TimeoutException:
            logger.warning(f"Timeout while reaching portal {url}. Skipping safely.")
            result["notes"] = "Portal connection timed out (non-blocking)."
        except Exception as exc:
            logger.warning(f"Error accessing portal {url}: {exc}. Skipping safely.")
            result["notes"] = f"Network or parsing error: {str(exc)}"

        return result

    async def run_batch_scrape(self) -> Dict:
        """
        Execute full batch scrape job and save to staging file.
        """
        self.last_scrape_status["status"] = "running"
        start_time = datetime.now()

        scraped_records = []
        errors = 0

        # Run concurrent requests with safe headers
        headers = {
            "User-Agent": "NitiSaathi-SchemeEnrichmentBot/1.0 (+https://nitisaathi.in/welfare-research)",
            "Accept": "text/html,application/xhtml+xml",
        }

        async with httpx.AsyncClient(headers=headers, verify=False) as client:
            tasks = [self.scrape_portal(portal, client) for portal in TARGET_PORTALS]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for res in results:
                if isinstance(res, dict):
                    scraped_records.append(res)
                    if res["status"] != "success":
                        errors += 1
                else:
                    errors += 1

        payload = {
            "generated_at": datetime.now().isoformat(),
            "target_portals_count": len(TARGET_PORTALS),
            "successful_scrapes": len([r for r in scraped_records if r["status"] == "success"]),
            "failed_scrapes": errors,
            "disclaimer": "This is a STAGING dataset for manual verification. It does not overwrite the primary knowledge base.",
            "staging_records": scraped_records,
        }

        # Write to staging file
        try:
            self.staging_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.staging_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to write staging file: {e}")

        duration = (datetime.now() - start_time).total_seconds()
        self.last_scrape_status = {
            "status": "completed",
            "last_run": datetime.now().isoformat(),
            "duration_seconds": round(duration, 2),
            "portals_scanned": len(TARGET_PORTALS),
            "items_discovered": len(scraped_records),
            "successful_count": payload["successful_scrapes"],
            "errors_logged": errors,
            "staging_file": str(self.staging_path),
        }

        return self.last_scrape_status


# Global singleton instance
portal_scraper_service = PortalScraperService()
