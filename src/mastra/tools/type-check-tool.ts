import { createTool } from '@mastra/core/tools';
import path from 'node:path';
import { z } from 'zod';
import ts from 'typescript';

const MAX_DIAGNOSTICS = 50;

export const typeCheckTool = createTool({
  id: 'type-check-file',
  description:
    'Run the TypeScript compiler over a TypeScript file and return real compiler ' +
    'diagnostics. Use this before reviewing a file so findings are grounded in ' +
    'the compiler rather than guessed. Paths are relative to the audit folder, ' +
    'for example "sample.ts".',
  inputSchema: z.object({
    filePath: z
      .string()
      .trim()
      .min(1)
      .max(300)
      .describe('Path of the file to type check, relative to the audit folder'),
  }),
  outputSchema: z.object({
    filePath: z.string(),
    ok: z.boolean(),
    errorCount: z.number(),
    warningCount: z.number(),
    truncated: z.boolean(),
    diagnostics: z.array(z.object({
      line: z.number(),
      column: z.number(),
      category: z.enum(['error', 'warning', 'suggestion', 'message']),
      code: z.number(),
      message: z.string(),
    })),
  }),
  execute: async ({ filePath }) => {
    return await typeCheck(filePath);
  },
});

const AUDIT_ROOT = path.resolve(process.cwd(), 'audit-sources');

const typeCheck = async (relativePath: string) => {
  const fullPath = path.resolve(AUDIT_ROOT, relativePath);

  // Containment is enforced here rather than trusted from the caller, because
  // this tool is registered globally and any agent could invoke it with an
  // absolute path or a parent-directory escape.
  const contained = fullPath === AUDIT_ROOT
    || fullPath.startsWith(`${AUDIT_ROOT}${path.sep}`);

  if (!contained) {
    throw new Error(`Path escapes the audit folder: ${relativePath}`);
  }

  if (!ts.sys.fileExists(fullPath)) {
    throw new Error(`File not found: ${relativePath}`);
  }

  const program = ts.createProgram([fullPath], {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    allowJs: false,
    esModuleInterop: true,
    resolveJsonModule: true,
    jsx: ts.JsxEmit.ReactJSX,
  });

  const diagnostics = [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ];

  const formatted = diagnostics
    .map(diagnostic => toPlainDiagnostic(diagnostic))
    .sort((a, b) => a.line - b.line || a.column - b.column);

  const truncated = formatted.length > MAX_DIAGNOSTICS;

  return {
    filePath: relativePath,
    ok: formatted.every(d => d.category !== 'error'),
    errorCount: formatted.filter(d => d.category === 'error').length,
    warningCount: formatted.filter(d => d.category === 'warning').length,
    truncated,
    diagnostics: truncated ? formatted.slice(0, MAX_DIAGNOSTICS) : formatted,
  };
};

const toPlainDiagnostic = (diagnostic: ts.Diagnostic) => {
  let line = 0;
  let column = 0;

  if (diagnostic.file && diagnostic.start !== undefined) {
    const { line: foundLine, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    line = foundLine + 1;
    column = character + 1;
  }

  return {
    line,
    column,
    category: diagnostic.category === ts.DiagnosticCategory.Error
      ? 'error' as const
      : diagnostic.category === ts.DiagnosticCategory.Warning
        ? 'warning' as const
        : diagnostic.category === ts.DiagnosticCategory.Suggestion
          ? 'suggestion' as const
          : 'message' as const,
    code: diagnostic.code,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
  };
};
