"""Cache unchanged official Linux artifacts; verify pinned hashes before local use."""
import concurrent.futures, hashlib, json, re, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".supabase-local" / "official-artifacts"
SERVICES = ("database", "auth", "rest", "storage", "imgproxy")
lock = json.loads((ROOT / "supabase/supabase.lock").read_text())
BASE = "https://github.com/supabase/slim-services/releases/download"
def cache_service(service):
    resolved = lock["services"][service]["resolved"]
    match = re.fullmatch(r"ghcr.io/supabase/cli/([a-z0-9-]+):([A-Za-z0-9._-]+)@sha256:[a-f0-9]{64}", resolved["image"])
    if not match: raise RuntimeError("Unrecognized official artifact image")
    name, version = match.groups()
    tag = f"{name}-{version}"
    stem = f"{tag}-linux-amd64"
    pins = resolved["natives"]["linux-amd64"]
    for kind, extension in (("manifest", ".manifest.json"), ("archive", ".tar.zst")):
        target = CACHE / tag / (stem + extension)
        target.parent.mkdir(parents=True, exist_ok=True)
        expected = pins[kind]
        if target.exists() and hashlib.file_digest(target.open("rb"), "sha256").hexdigest() == expected:
            continue
        temporary = target.with_suffix(target.suffix + ".partial")
        subprocess.run(["curl", "--fail", "--silent", "--show-error", "--location", "--connect-timeout", "10", "--max-time", "150", "--output", str(temporary), f"{BASE}/{tag}/{target.name}"], check=True)
        actual = hashlib.file_digest(temporary.open("rb"), "sha256").hexdigest()
        if actual != expected: raise RuntimeError(f"Pinned digest mismatch for {name} {kind}")
        temporary.replace(target)
    return {"service": service, "archive_sha256": pins["archive"], "manifest_sha256": pins["manifest"], "verified": True}
if __name__ == "__main__":
    CACHE.mkdir(parents=True, exist_ok=True)
    CACHE.parent.chmod(0o700)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(cache_service, SERVICES))
    (CACHE.parent / "artifact-evidence.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))
