import { Notice } from 'obsidian';

export function reportError(context: string, error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    new Notice(`${context}: ${message}`);
    console.error(`[MovieLog] ${context}:`, error);
}
