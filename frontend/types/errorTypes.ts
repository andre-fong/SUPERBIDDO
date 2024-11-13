export enum Severity {
    Critical = "critical",
    Warning = "warning"
}

export interface ErrorType {
    message: string;
    severity: Severity;
}
