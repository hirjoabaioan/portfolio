// Pattern: AI-assisted data import where the model writes a *spec*, never code.
// Rewritten from an import assistant I run in production (generic names, no product code).
//
// Users upload messy spreadsheets from other tools. The model sees only the headers and a few
// MASKED sample values, and returns a declarative mapping. Deterministic code validates the
// mapping against a whitelist and applies it. Nothing the model writes is ever executed.

import { z } from 'zod';

const TARGET_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'birthDate', 'notes'] as const;
const TRANSFORMS = ['trim', 'lowercase', 'titleCase', 'digitsOnly', 'e164:RO', 'date:DD.MM.YYYY', 'date:MM/DD/YYYY', 'splitName'] as const;

export const MappingSpec = z.object({
  entity: z.enum(['client', 'appointment', 'product']),
  columns: z.array(z.object({
    source: z.string(),                       // a header from the file
    target: z.enum(TARGET_FIELDS).nullable(), // null = ignore this column
    transforms: z.array(z.enum(TRANSFORMS)).max(4),
  })),
  confidence: z.number().min(0).max(1),
});
export type MappingSpec = z.infer<typeof MappingSpec>;

/** What the model is allowed to see: headers plus masked samples (no real names, emails or numbers). */
export function maskSample(value: string): string {
  return value
    .replace(/[A-Za-zĂÂÎȘȚăâîșț]/g, (c) => (c === c.toUpperCase() ? 'A' : 'a'))
    .replace(/\d/g, '9');
}

export function checkSpec(raw: unknown, headers: string[]): { spec?: MappingSpec; errors: string[] } {
  const parsed = MappingSpec.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
  const errors: string[] = [];
  const targets = new Set<string>();
  for (const c of parsed.data.columns) {
    if (!headers.includes(c.source)) errors.push(`unknown source column "${c.source}"`);
    if (c.target && targets.has(c.target)) errors.push(`two columns map to ${c.target}`);
    if (c.target) targets.add(c.target);
  }
  return errors.length ? { errors } : { spec: parsed.data, errors };
}

const apply: Record<(typeof TRANSFORMS)[number], (v: string) => string> = {
  trim: (v) => v.trim(),
  lowercase: (v) => v.toLowerCase(),
  titleCase: (v) => v.toLowerCase().replace(/(^|\s|-)\p{L}/gu, (m) => m.toUpperCase()),
  digitsOnly: (v) => v.replace(/\D/g, ''),
  'e164:RO': (v) => { const d = v.replace(/\D/g, '').replace(/^0040|^40|^0/, ''); return d.length === 9 ? `+40${d}` : v; },
  'date:DD.MM.YYYY': (v) => { const m = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : v; },
  'date:MM/DD/YYYY': (v) => { const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : v; },
  splitName: (v) => v, // handled at row level below: "Last First" -> two fields
};

export function applySpec(spec: MappingSpec, row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of spec.columns) {
    if (!c.target) continue;
    let v = row[c.source] ?? '';
    for (const t of c.transforms) v = apply[t](v);
    if (c.transforms.includes('splitName') && c.target === 'lastName') {
      const [last, ...rest] = v.trim().split(/\s+/);
      out.lastName = last ?? '';
      out.firstName ||= rest.join(' ');
      continue;
    }
    out[c.target] = v;
  }
  return out;
}
