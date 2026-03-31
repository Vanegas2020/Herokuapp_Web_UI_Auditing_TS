import type { Finding } from './RuleEvaluator';

export interface FieldAuditResult {
  fieldId: string;
  fieldName: string;
  fieldCategory: string;
  maturityState: string;
  findings: Finding[];
  fqi: number;
  smi: number;
}

export interface CheckPointAudit {
  id: string;
  checkpointNumber: number;
  description: string;
  type: 'AUDITING';
  targetElement: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  metadata: {
    fieldCategory: string;
    maturityState: string;
    fqi: number;
    smi: number;
    findingsCount: number;
    findings: Finding[];
  };
}

export class CPGenerator {
  public generateCheckpoint(result: FieldAuditResult, index: number): CheckPointAudit {
    const hasCriticalOrError = result.findings.some(f => !f.passed && (f.severity === 'Critical' || f.severity === 'Error'));
    const hasWarning = result.findings.some(f => !f.passed && f.severity === 'Warning');
    const status = hasCriticalOrError ? 'FAIL' : hasWarning ? 'WARN' : 'PASS';
    return {
      id: `AUDIT-CP-${(index + 1).toString().padStart(3, '0')}`,
      checkpointNumber: index + 1,
      description: `Audit: ${result.fieldCategory} | ${result.fieldName}`,
      type: 'AUDITING',
      targetElement: result.fieldId,
      status,
      metadata: {
        fieldCategory: result.fieldCategory,
        maturityState: result.maturityState,
        fqi: result.fqi,
        smi: result.smi,
        findingsCount: result.findings.length,
        findings: result.findings,
      }
    };
  }
}
