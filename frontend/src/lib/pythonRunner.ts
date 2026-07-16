import type { SkillProofTest, SkillProofTestResult } from "../types";

const BLOCKED_SOURCE = /\b(import|from|open|eval|exec|compile|globals|locals|getattr|setattr)\b|__/;

const workerSource = `
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs";

self.onmessage = async (event) => {
  const { code, functionName, tests } = event.data;
  try {
    const pyodide = await loadPyodide();
    pyodide.globals.set("_candidate_code", code);
    pyodide.globals.set("_skillproof_payload", JSON.stringify({ functionName, tests }));
    const result = await pyodide.runPythonAsync(\`
import json

payload = json.loads(_skillproof_payload)
safe_builtins = {
    "str": str,
    "ValueError": ValueError,
    "True": True,
    "False": False,
    "None": None,
}
namespace = {"__builtins__": safe_builtins}
results = []

try:
    exec(_candidate_code, namespace, namespace)
    function = namespace.get(payload["functionName"])
    if not callable(function):
        raise ValueError("Required function was not defined")

    for test in payload["tests"]:
        try:
            actual = function(test["input"])
            if test.get("expected_error"):
                results.append({
                    "id": test["id"],
                    "passed": False,
                    "detail": "Expected " + test["expected_error"] + " but no error was raised",
                })
            else:
                passed = actual == test.get("expected")
                results.append({
                    "id": test["id"],
                    "passed": passed,
                    "detail": "Passed" if passed else "Expected " + repr(test.get("expected")) + ", got " + repr(actual),
                })
        except Exception as error:
            expected_error = test.get("expected_error")
            passed = expected_error == error.__class__.__name__
            results.append({
                "id": test["id"],
                "passed": passed,
                "detail": "Passed" if passed else error.__class__.__name__ + ": " + str(error),
            })
except Exception as error:
    results = [{
        "id": test["id"],
        "passed": False,
        "detail": error.__class__.__name__ + ": " + str(error),
    } for test in payload["tests"]]

json.dumps(results)
    \`);
    self.postMessage({ results: JSON.parse(result) });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Python runtime failed" });
  }
};
`;

export async function runPythonChallenge(
  code: string,
  functionName: string,
  tests: SkillProofTest[],
): Promise<SkillProofTestResult[]> {
  if (BLOCKED_SOURCE.test(code)) {
    throw new Error("Imports, private attributes, and dynamic execution are disabled in this challenge.");
  }

  const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
  const worker = new Worker(workerUrl, { type: "module" });

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error("The isolated Python run timed out. Check for an infinite loop."));
    }, 45_000);

    worker.onmessage = (event: MessageEvent<{ results?: SkillProofTestResult[]; error?: string }>) => {
      window.clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.results || []);
    };
    worker.onerror = () => {
      window.clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error("The browser could not start the isolated Python runtime."));
    };
    worker.postMessage({ code, functionName, tests });
  });
}
