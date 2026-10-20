// Pattern: let an LLM draft a multi-step plan as a graph, then never trust the graph.
// Rewritten from a campaign planner I run in production (generic names, no product code).
//
// The model returns nodes + edges through a JSON response schema. Deterministic code then:
//   1. validates shape and references,
//   2. detects cycles,
//   3. repairs what can be repaired safely and reports what it changed,
// so the UI only ever renders a plan that is a valid DAG.

type NodeKind = 'start' | 'message' | 'wait' | 'condition' | 'end';

interface PlanNode { id: string; kind: NodeKind; label: string; delayHours?: number }
interface PlanEdge { from: string; to: string; when?: 'yes' | 'no' }
interface Plan { nodes: PlanNode[]; edges: PlanEdge[] }

interface Report { valid: boolean; problems: string[]; repairs: string[] }

export function validatePlan(plan: Plan): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const n of plan.nodes) {
    if (ids.has(n.id)) problems.push(`duplicate node id ${n.id}`);
    ids.add(n.id);
    if (n.kind === 'wait' && !(n.delayHours && n.delayHours > 0)) problems.push(`wait node ${n.id} has no positive delay`);
  }
  if (plan.nodes.filter((n) => n.kind === 'start').length !== 1) problems.push('plan must have exactly one start node');
  for (const e of plan.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) problems.push(`edge ${e.from}->${e.to} references a missing node`);
  }
  for (const n of plan.nodes.filter((x) => x.kind === 'condition')) {
    const outs = plan.edges.filter((e) => e.from === n.id).map((e) => e.when);
    if (!outs.includes('yes') || !outs.includes('no')) problems.push(`condition ${n.id} needs both a yes and a no branch`);
  }
  if (hasCycle(plan)) problems.push('plan contains a cycle');
  return problems;
}

/** Iterative DFS with colours; a back edge (to a node still on the stack) means a cycle. */
export function hasCycle(plan: Plan): boolean {
  const out = new Map<string, string[]>();
  for (const e of plan.edges) out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  const colour = new Map<string, 0 | 1 | 2>(); // 0 new, 1 on stack, 2 done
  for (const start of plan.nodes.map((n) => n.id)) {
    if (colour.get(start)) continue;
    const stack: [string, number][] = [[start, 0]];
    colour.set(start, 1);
    while (stack.length) {
      const top = stack[stack.length - 1];
      const next = (out.get(top[0]) ?? [])[top[1]++];
      if (next === undefined) { colour.set(top[0], 2); stack.pop(); continue; }
      const c = colour.get(next) ?? 0;
      if (c === 1) return true;
      if (c === 0) { colour.set(next, 1); stack.push([next, 0]); }
    }
  }
  return false;
}

/** Only repairs that cannot change the plan's intent. Anything else is reported back to the model or the user. */
export function repairPlan(plan: Plan): { plan: Plan; report: Report } {
  const repairs: string[] = [];
  const ids = new Set(plan.nodes.map((n) => n.id));
  const seen = new Set<string>();
  const edges = plan.edges.filter((e) => {
    const key = `${e.from}>${e.to}>${e.when ?? ''}`;
    if (!ids.has(e.from) || !ids.has(e.to)) { repairs.push(`dropped dangling edge ${e.from}->${e.to}`); return false; }
    if (seen.has(key)) { repairs.push(`dropped duplicate edge ${e.from}->${e.to}`); return false; }
    seen.add(key);
    return true;
  });
  const nodes = plan.nodes.map((n) =>
    n.kind === 'wait' && !(n.delayHours && n.delayHours > 0) ? (repairs.push(`wait ${n.id}: defaulted delay to 24h`), { ...n, delayHours: 24 }) : n,
  );
  const fixed = { nodes, edges };
  const problems = validatePlan(fixed);
  return { plan: fixed, report: { valid: problems.length === 0, problems, repairs } };
}
