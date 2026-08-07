"""Wrapper that runs audit.py and writes results to audit_result.txt"""
import subprocess, sys, os

result = subprocess.run(
    [sys.executable, "audit.py"],
    capture_output=True,
    text=True,
    cwd=os.path.dirname(os.path.abspath(__file__))
)

output = result.stdout + ("\n--- STDERR ---\n" + result.stderr if result.stderr.strip() else "")
with open("audit_result.txt", "w", encoding="utf-8") as f:
    f.write(output)

print(output)
print(f"\nReturn code: {result.returncode}")
