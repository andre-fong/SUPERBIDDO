export enum Severity {
    Info = "info",
    Critical = "critical",
    Warning = "warning"
}

export interface ErrorType {
    message: string;
    severity: Severity;
}
