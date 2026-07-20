/**
 * A deliberately tiny expression evaluator for condition nodes. Supports simple
 * comparisons joined by all-&& or all-|| (not mixed). No parentheses, no eval.
 * Anything outside this grammar throws with a Vietnamese message. Known limit:
 * a string literal containing && or || is not supported (splitting is textual).
 */
export function evaluate(expression: string, variables: Record<string, string>): boolean {
  const expr = expression.trim();
  if (expr === '') throw new Error('Biểu thức rỗng');

  const hasAnd = expr.includes('&&');
  const hasOr = expr.includes('||');
  if (hasAnd && hasOr) throw new Error('Không được trộn && và || trong một biểu thức');
  if (hasAnd) return expr.split('&&').every((part) => evalComparison(part, variables));
  if (hasOr) return expr.split('||').some((part) => evalComparison(part, variables));
  return evalComparison(expr, variables);
}

// Longer operators first so ">=" is not read as ">".
const COMPARE_OPS = ['>=', '<=', '==', '!=', '>', '<'];

function evalComparison(raw: string, variables: Record<string, string>): boolean {
  const part = raw.trim();
  for (const op of COMPARE_OPS) {
    const i = part.indexOf(op);
    if (i <= 0) continue; // -1 = not found; 0 = no left operand
    const lhs = part.slice(0, i).trim();
    const rhs = part.slice(i + op.length).trim();
    if (rhs === '') break;
    return compare(lhs, op, rhs, variables);
  }
  throw new Error(`Không hiểu điều kiện: "${part}"`);
}

function compare(lhs: string, op: string, rhs: string, variables: Record<string, string>): boolean {
  if (op === '==' || op === '!=') {
    const l = resolveStr(lhs, variables);
    const r = resolveStr(rhs, variables);
    return op === '==' ? l === r : l !== r;
  }
  const l = resolveNum(lhs, variables);
  const r = resolveNum(rhs, variables);
  if (op === '>') return l > r;
  if (op === '<') return l < r;
  if (op === '>=') return l >= r;
  return l <= r; // '<='
}

function resolveStr(operand: string, variables: Record<string, string>): string {
  if (/^'.*'$/.test(operand)) return operand.slice(1, -1); // string literal
  if (/^-?\d+(\.\d+)?$/.test(operand)) return operand; // number literal
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(operand)) return variables[operand] ?? ''; // identifier
  throw new Error(`Toán hạng không hợp lệ: "${operand}"`);
}

function resolveNum(operand: string, variables: Record<string, string>): number {
  const s = resolveStr(operand, variables);
  if (!/^-?\d+(\.\d+)?$/.test(s.trim())) {
    throw new Error(`Không so sánh số được với "${operand}" (giá trị: "${s}")`);
  }
  return Number(s);
}
