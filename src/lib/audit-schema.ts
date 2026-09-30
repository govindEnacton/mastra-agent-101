import { z } from 'zod';

export const auditFindingSchema = z.object({
  title: z.string().describe('Short summary of the issue'),
  severity: z
    .enum(['critical', 'high', 'medium', 'low'])
    .describe('How serious the issue is if left unfixed'),
  category: z
    .enum(['implicit-any', 'unsafe-cast', 'null-safety', 'loose-types', 'missing-annotation', 'error-handling', 'other'])
    .describe('The kind of type-safety problem'),
  line: z.number().describe('Line number where the issue starts'),
  evidence: z.string().describe('The offending code, quoted exactly from the file'),
  why: z.string().describe('Why this is a type-safety risk'),
  fix: z.string().describe('The concrete change to make, with corrected code'),
  compilerConfirmed: z
    .boolean()
    .describe('True when the TypeScript compiler reported this, false when found by review'),
});

export const auditReportSchema = z.object({
  filePath: z.string().describe('The audited file, relative to the audit folder'),
  verdict: z
    .enum(['pass', 'pass-with-comments', 'fail'])
    .describe('Overall result of the audit'),
  summary: z.string().describe('Two or three sentences on the file’s type-safety posture'),
  typeCheckRan: z.boolean().describe('Whether the compiler was run on this file'),
  compilerOk: z.boolean().describe('Whether the compiler reported zero errors'),
  findings: z.array(auditFindingSchema),
});

export type AuditReport = z.infer<typeof auditReportSchema>;
