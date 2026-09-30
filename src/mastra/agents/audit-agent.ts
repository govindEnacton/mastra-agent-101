import { Agent } from '@mastra/core/agent';
import { LocalFilesystem, Workspace } from '@mastra/core/workspace';
import { auditReportSchema } from '../../lib/audit-schema';
import { openrouterModels } from '../provider/openrouter';
import { typeCheckTool } from '../tools/type-check-tool';

const auditFilesystem = new LocalFilesystem({
  id: 'audit-sources',
  basePath: './audit-sources',
  contained: true,
  readOnly: true,
});

const auditWorkspace = new Workspace({
  filesystem: auditFilesystem,
});

export const auditAgent = new Agent({
  id: 'audit-agent',
  name: 'Type Safety Audit Agent',
  description:
    'Audits a TypeScript file for type-safety problems and produces a structured ' +
    'report. Runs the TypeScript compiler for hard errors, then reviews the source ' +
    'for issues the compiler cannot detect.',
  instructions: `You audit TypeScript files for type-safety defects and return a structured report.

Procedure:
1. Use typeCheckTool on the requested file. Pass the path exactly as the user gave
   it, relative to the audit folder, for example "sample.ts". This gives you real
   compiler diagnostics and must happen before you write any findings.
2. Use read_file to read the full source. You cannot judge type safety from
   diagnostics alone, and you need the real code to quote evidence.
3. Write the report. Ground every finding in code you actually read.

What to report:

From the compiler, mark compilerConfirmed: true:
- Each error and suggestion, such as implicit any parameters, unchecked
  non-null assertions, unused or unreachable code.

From your own review, mark compilerConfirmed: false:
- The any type where it erases real structure, including values from JSON.parse.
- Unchecked casts and angle-bracket assertions, such as <string>value.
- Missing parameter and return type annotations on exported functions.
- Null and undefined handling that is assumed rather than checked.
- Silent fallthrough: a loop variable declared outside the loop and thrown after
  it, which can be undefined if the loop never runs.
- Lossy types where a broad type such as any or object hides fields the code reads.

Rules:
- Quote evidence exactly from the file. Do not invent lines that do not exist.
- Give a concrete fix, not advice. Show the corrected code.
- Set line to the line where the problem starts.
- Do not report style preferences, formatting, or naming. This is a type-safety
  audit only.
- Do not report the absence of tests, error logging, or documentation. Those are
  not type-safety issues.
- If the file is genuinely clean, return an empty findings array and do not invent
  issues to fill it.

Verdict:
- "fail" when there are critical or high findings, or the compiler reported errors.
- "pass-with-comments" when there are only medium or low findings.
- "pass" when there are none.`,
  model: openrouterModels,
  workspace: auditWorkspace,
  tools: { typeCheckTool },
  defaultOptions: {
    maxSteps: 12,
    structuredOutput: {
      schema: auditReportSchema,
      jsonPromptInjection: 'inline',
    },
  },
});
