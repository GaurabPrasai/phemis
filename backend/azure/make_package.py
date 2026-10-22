"""Build the Azure deployment package for the Django backend.

The package is a zip whose root is the backend app root (the directory
that holds manage.py), because that is where App Service runs the
startup command from.

Usage:
    python backend/azure/make_package.py --backend backend --out backend/deploy-package/backend.zip
"""

import argparse
import os
import sys
import zipfile
from pathlib import Path

# Development-only directories and files that must never reach Azure.
EXCLUDED_DIRS = {
    "venv",
    ".venv",
    "node_modules",
    "__pycache__",
    ".git",
    ".vercel",
    ".pytest_cache",
    "deploy-package",
    "azure",  # deployment tooling, not runtime code
}

EXCLUDED_FILES = {
    ".env",
    ".gitignore",
    ".gitattributes",
    "db.sqlite3",
}

EXCLUDED_SUFFIXES = (".pyc", ".pyo", ".log", ".bak")


def is_excluded_dir(name: str) -> bool:
    return name in EXCLUDED_DIRS or name.endswith(".egg-info")


def is_excluded_file(name: str) -> bool:
    if name in EXCLUDED_FILES:
        return True
    if name.endswith(EXCLUDED_SUFFIXES):
        return True
    if name.startswith(".env."):
        return True
    return False


def collect(backend: Path):
    """Yield (absolute path, path relative to the backend root)."""
    for dirpath, dirnames, filenames in os.walk(backend):
        dirnames[:] = sorted(d for d in dirnames if not is_excluded_dir(d))
        for filename in sorted(filenames):
            if is_excluded_file(filename):
                continue
            absolute = Path(dirpath) / filename
            yield absolute, str(absolute.relative_to(backend)).replace(os.sep, "/")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backend", required=True, help="Path to the backend app root")
    parser.add_argument("--out", required=True, help="Path of the zip file to write")
    args = parser.parse_args()

    backend = Path(args.backend).resolve()
    if not (backend / "manage.py").is_file():
        print(f"error: {backend} does not contain manage.py", file=sys.stderr)
        return 1

    out = Path(args.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        out.unlink()

    count = 0
    total = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=1) as archive:
        for absolute, relative in collect(backend):
            archive.write(absolute, relative)
            count += 1
            total += absolute.stat().st_size
            if count % 25 == 0:
                print(f"  ... {count} files", flush=True)

    size_mb = out.stat().st_size / (1024 * 1024)
    print(f"Packaged {count} files ({total / (1024 * 1024):.1f} MB raw)")
    print(f"Package: {out} ({size_mb:.1f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
