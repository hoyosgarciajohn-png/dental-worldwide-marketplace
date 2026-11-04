"""Run M0 native stack using a loopback mirror of verified official artifacts."""
import functools, http.server, json, os, shlex, subprocess, sys, threading, pwd
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / ".supabase-local"
LOCAL.mkdir(mode=0o700, exist_ok=True)
LOCAL.chmod(0o700)
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args): pass
handler = functools.partial(QuietHandler, directory=str(LOCAL / "official-artifacts"))
server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
runtime_home = os.environ.get("M0_SUPABASE_HOME", str(LOCAL / "runtime"))
postgres_user = os.environ.get("M0_POSTGRES_USER", "oai")
env = dict(os.environ, SUPABASE_HOME=runtime_home, SUPABASE_INTERNAL_SLIM_RELEASES_URL=f"http://127.0.0.1:{server.server_port}")
if os.getuid() == 0:
    env["SUPABASE_NATIVE_POSTGRES_USER"] = postgres_user
    user = pwd.getpwnam(postgres_user)
    # Verify the host supports the required identity change. Never bypass PostgreSQL's root check.
    probe = subprocess.run([sys.executable, "-c", "import os; os.setgid(" + str(user.pw_gid) + "); os.setuid(" + str(user.pw_uid) + ")"], capture_output=True, text=True)
    if probe.returncode:
        server.shutdown()
        print("BLOCKED: host cannot switch to a non-root PostgreSQL account; DB/Auth/Storage checks NOT PERFORMED")
        raise SystemExit(2)
cli = str(ROOT / "node_modules/.bin/supabase")
def run(args, name, timeout=180):
    result = subprocess.run([cli, *args], cwd=ROOT, env=env, capture_output=True, text=True, timeout=timeout)
    (LOCAL / f"{name}.log").write_text(result.stdout + result.stderr)
    print(name, "exit", result.returncode, flush=True)
    if result.returncode:
        # Logs may contain credentials. Emit only a safe failure marker.
        raise RuntimeError(f"{name} failed; inspect ignored local log with credential redaction")
    return result.stdout
try:
    run(["start", "--runtime", "native", "--eager", "--frozen", "--exclude", "studio,functions,realtime,analytics,pooler,mail"], "native-start")
    raw = run(["status", "--env", "--output-format", "text"], "native-status")
    config = {}
    for line in raw.splitlines():
        if "=" in line:
            key, value = line.split("=", 1)
            if key.strip().replace("_", "").isalnum():
                try: config[key.strip()] = shlex.split(value)[0]
                except (ValueError, IndexError): pass
    connection = LOCAL / "connection.json"
    connection.write_text(json.dumps(config))
    connection.chmod(0o600)
    print("Exported connection field names:", ", ".join(sorted(config)), flush=True)
    query = run(["db", "query", "--read-only", "select 1 as m0_probe, current_database() as database, 1 / (exists(select 1 from pg_namespace where nspname = 'auth')::int) as auth_schema, 1 / (exists(select 1 from pg_namespace where nspname = 'storage')::int) as storage_schema", "--output-format", "json"], "database-probe")
    print(query, flush=True)
    services = subprocess.run(["node", "scripts/m0-services-smoke.mjs"], cwd=ROOT, env=env, timeout=120)
    if services.returncode: raise RuntimeError("M0 service smoke failed")
finally:
    # Stop only this project's local stack, preserving data; never use --all.
    stopped = subprocess.run([cli, "stop"], cwd=ROOT, env=env, capture_output=True, text=True, timeout=30)
    (LOCAL / "native-stop.log").write_text(stopped.stdout + stopped.stderr)
    server.shutdown()
