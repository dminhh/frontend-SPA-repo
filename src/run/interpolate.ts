/** Replaces {{name}} placeholders with variables[name] (or '' if unset). Trims
 *  whitespace inside the braces. Pure — no side effects. */
export function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, name) => variables[name] ?? '');
}
