import type { AuditReport } from '@/lib/audit-schema';
import type { UIMessage } from 'ai';

export function getAuditReport(message: UIMessage): AuditReport | undefined {
  if (message.role !== 'assistant') return;

  for (const part of message.parts) {
    if (part.type !== 'data-structured-output') continue;
    const data = part.data;
    if (typeof data !== 'object' || data === null || !('object' in data)) continue;
    const object = data.object;
    if (typeof object !== 'object' || object === null) continue;
    const report = object as AuditReport;
    if (typeof report.verdict === 'string' && Array.isArray(report.findings)) {
      return report;
    }
  }

  return undefined;
}
