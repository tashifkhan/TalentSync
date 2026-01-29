"""Sandboxed code execution service for coding interview questions."""

import asyncio
import os
import tempfile
from typing import Dict, List, Optional

from app.models.interview.schemas import CodeExecutionResult


class CodeExecutor:
    """Sandboxed code execution service for interview coding questions."""

    SUPPORTED_LANGUAGES: Dict[str, Dict] = {
        "python": {
            "extension": ".py",
            "cmd": ["python3"],
            "timeout": 10,
        },
        "javascript": {
            "extension": ".js",
            "cmd": ["node"],
            "timeout": 10,
        },
        "typescript": {
            "extension": ".ts",
            "cmd": ["npx", "ts-node"],
            "timeout": 15,
        },
    }

    MAX_OUTPUT_LENGTH = 10000
    MAX_CODE_LENGTH = 50000

    async def execute(
        self,
        code: str,
        language: str,
        test_input: Optional[str] = None,
    ) -> CodeExecutionResult:
        """Execute code in a sandboxed environment.

        Args:
            code: The code to execute
            language: Programming language (python, javascript, typescript)
            test_input: Optional input to pass to the program

        Returns:
            CodeExecutionResult with stdout, stderr, and execution info
        """
        # Validate language
        if language not in self.SUPPORTED_LANGUAGES:
            return CodeExecutionResult(
                success=False,
                stdout="",
                stderr=f"Unsupported language: {language}. Supported: {list(self.SUPPORTED_LANGUAGES.keys())}",
                execution_time_ms=0,
            )

        # Validate code length
        if len(code) > self.MAX_CODE_LENGTH:
            return CodeExecutionResult(
                success=False,
                stdout="",
                stderr=f"Code too long. Maximum {self.MAX_CODE_LENGTH} characters allowed.",
                execution_time_ms=0,
            )

        # Basic security checks
        security_check = self._security_check(
            code, language, allow_input=bool(test_input)
        )
        if security_check:
            return CodeExecutionResult(
                success=False,
                stdout="",
                stderr=security_check,
                execution_time_ms=0,
            )

        config = self.SUPPORTED_LANGUAGES[language]

        try:
            # Create temporary file for the code
            with tempfile.NamedTemporaryFile(
                mode="w",
                suffix=config["extension"],
                delete=False,
            ) as f:
                f.write(code)
                temp_file = f.name

            try:
                start_time = asyncio.get_event_loop().time()

                # Build command
                cmd = config["cmd"] + [temp_file]

                # Create subprocess
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    stdin=asyncio.subprocess.PIPE if test_input else None,
                )

                try:
                    # Run with timeout
                    stdout_bytes, stderr_bytes = await asyncio.wait_for(
                        process.communicate(
                            input=test_input.encode() if test_input else None
                        ),
                        timeout=config["timeout"],
                    )
                except asyncio.TimeoutError:
                    process.kill()
                    await process.wait()
                    return CodeExecutionResult(
                        success=False,
                        stdout="",
                        stderr=f"Execution timed out after {config['timeout']} seconds",
                        execution_time_ms=int(config["timeout"] * 1000),
                    )

                execution_time = int(
                    (asyncio.get_event_loop().time() - start_time) * 1000
                )

                stdout = stdout_bytes.decode("utf-8", errors="replace")
                stderr = stderr_bytes.decode("utf-8", errors="replace")

                return CodeExecutionResult(
                    success=process.returncode == 0,
                    stdout=stdout[: self.MAX_OUTPUT_LENGTH],
                    stderr=stderr[: self.MAX_OUTPUT_LENGTH],
                    execution_time_ms=execution_time,
                )

            finally:
                # Clean up temp file
                try:
                    os.unlink(temp_file)
                except OSError:
                    pass

        except Exception as e:
            return CodeExecutionResult(
                success=False,
                stdout="",
                stderr=f"Execution error: {str(e)}",
                execution_time_ms=0,
            )

    def _security_check(
        self,
        code: str,
        language: str,
        allow_input: bool = False,
    ) -> Optional[str]:
        """Perform basic security checks on the code.

        Returns error message if security issue found, None otherwise.
        """
        # Dangerous patterns to block
        dangerous_patterns = {
            "python": [
                "import os",
                "import subprocess",
                "import sys",
                "__import__",
                "exec(",
                "eval(",
                "open(",
                "file(",
                "input(",
                "os.system",
                "os.popen",
                "subprocess.",
                "shutil.",
                "pathlib.",
            ],
            "javascript": [
                "require('child_process')",
                "require('fs')",
                "require('os')",
                "require('path')",
                "process.exit",
                "process.env",
                "eval(",
                "Function(",
                "require('net')",
                "require('http')",
            ],
            "typescript": [
                "require('child_process')",
                "require('fs')",
                "require('os')",
                "import * as fs",
                "import * as os",
                "import * as child_process",
                "process.exit",
                "eval(",
            ],
        }

        patterns = dangerous_patterns.get(language, [])
        code_lower = code.lower()

        for pattern in patterns:
            if allow_input and language == "python" and pattern == "input(":
                continue
            if pattern.lower() in code_lower:
                return f"Security: Potentially dangerous code pattern detected: '{pattern}'"

        return None

    def get_supported_languages(self) -> List[str]:
        """Get list of supported programming languages."""
        return list(self.SUPPORTED_LANGUAGES.keys())

    async def run_with_tests(
        self,
        code: str,
        language: str,
        test_cases: List[Dict],
    ) -> CodeExecutionResult:
        """Run code with multiple test cases.

        Args:
            code: The code to execute
            language: Programming language
            test_cases: List of {"input": "...", "expected": "..."}

        Returns:
            CodeExecutionResult with test results
        """
        all_passed = True
        test_results = []
        total_time = 0

        for i, test in enumerate(test_cases):
            result = await self.execute(
                code=code,
                language=language,
                test_input=test.get("input"),
            )

            total_time += result.execution_time_ms

            passed = (
                result.success
                and result.stdout.strip() == test.get("expected", "").strip()
            )
            all_passed = all_passed and passed

            test_results.append(
                {
                    "test_number": i + 1,
                    "passed": passed,
                    "input": test.get("input", ""),
                    "expected": test.get("expected", ""),
                    "actual": result.stdout.strip(),
                    "error": result.stderr if not result.success else None,
                }
            )

        # Combine results
        passed_count = sum(1 for t in test_results if t["passed"])
        summary = f"Passed {passed_count}/{len(test_cases)} test cases"

        return CodeExecutionResult(
            success=all_passed,
            stdout=summary,
            stderr="" if all_passed else "Some test cases failed",
            execution_time_ms=total_time,
            test_results=test_results,
        )
