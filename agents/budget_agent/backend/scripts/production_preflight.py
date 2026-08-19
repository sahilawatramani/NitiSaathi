import argparse
import os
import sys
from dataclasses import dataclass


@dataclass
class CheckResult:
    name: str
    ok: bool
    message: str


def _get_env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def run_checks() -> list[CheckResult]:
    results: list[CheckResult] = []

    jwt_secret = _get_env("JWT_SECRET_KEY", "")
    results.append(
        CheckResult(
            name="JWT secret configured",
            ok=bool(jwt_secret and jwt_secret != "change-me-in-production"),
            message="JWT_SECRET_KEY must be set and not left as default.",
        )
    )

    webhook_secret = _get_env("WEBHOOK_SECRET", "")
    results.append(
        CheckResult(
            name="Webhook secret configured",
            ok=bool(webhook_secret and webhook_secret != "finassist-dev-secret"),
            message="WEBHOOK_SECRET must be set and not left as default.",
        )
    )

    auto_create = _get_env("AUTO_CREATE_TABLES", "true").lower()
    results.append(
        CheckResult(
            name="Auto create tables disabled",
            ok=auto_create == "false",
            message="AUTO_CREATE_TABLES should be false in production (use Alembic migrations).",
        )
    )

    cors_origins = _get_env("CORS_ALLOWED_ORIGINS", "*")
    results.append(
        CheckResult(
            name="CORS origins restricted",
            ok=cors_origins != "*",
            message="CORS_ALLOWED_ORIGINS should be an explicit comma-separated allowlist.",
        )
    )

    trusted_hosts = _get_env("TRUSTED_HOSTS", "*")
    results.append(
        CheckResult(
            name="Trusted hosts restricted",
            ok=trusted_hosts != "*",
            message="TRUSTED_HOSTS should be an explicit comma-separated host allowlist.",
        )
    )

    require_https = _get_env("REQUIRE_HTTPS", "false").lower()
    results.append(
        CheckResult(
            name="HTTPS enforcement enabled",
            ok=require_https == "true",
            message="Set REQUIRE_HTTPS=true behind HTTPS termination in production.",
        )
    )

    db_url = _get_env("DATABASE_URL", "")
    results.append(
        CheckResult(
            name="Database URL configured",
            ok=bool(db_url),
            message="DATABASE_URL must be configured.",
        )
    )

    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="FinAssist production preflight checks")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with code 1 if any check fails.",
    )
    args = parser.parse_args()

    results = run_checks()
    failed = [r for r in results if not r.ok]

    print("FinAssist Production Preflight")
    print("=" * 32)
    for result in results:
        status = "PASS" if result.ok else "FAIL"
        print(f"[{status}] {result.name} - {result.message}")

    print("\nSummary:")
    print(f"- Passed: {len(results) - len(failed)}")
    print(f"- Failed: {len(failed)}")

    if args.strict and failed:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
