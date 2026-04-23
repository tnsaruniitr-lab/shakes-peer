import type { HandlerResult, HandlerState, Instruction } from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// edit_schema handler
//
// Used for two flavors of patch:
//   • meta_tag_edit   → target = meta key (e.g. "og:title"). Update
//                       metaTags[key] AND the corresponding <meta> tag in HTML.
//   • schema field    → target = "<@type>.<field>" (e.g. "BlogPosting.author.name")
//                       Update the JSON-LD object in place; re-serialize the
//                       <script type="application/ld+json"> block.
//
// When `patch.before` is non-empty we verify the current value matches before
// swapping, to prevent stale patches from trampling newer content.
// ─────────────────────────────────────────────────────────────────────────────

export function editSchemaHandler(
  state: HandlerState,
  instruction: Instruction,
): HandlerResult {
  const base = {
    ...state,
    checkId: instruction.check_id,
    action: instruction.action,
  };

  const patch = instruction.patch;
  if (!patch) {
    return { ...base, outcome: "skipped", reason: "no patch envelope" };
  }

  const isMetaEdit =
    patch.type === "meta_tag_edit" ||
    /^(og:|twitter:|article:)/.test(patch.target) ||
    patch.target === "title" ||
    patch.target === "description" ||
    patch.target === "canonical";

  if (isMetaEdit) {
    return editMetaTag(base, state, patch);
  }

  return editJsonLdField(base, state, patch);
}

function editMetaTag(
  base: Omit<HandlerResult, "outcome">,
  state: HandlerState,
  patch: NonNullable<Instruction["patch"]>,
): HandlerResult {
  const key = patch.target;
  const current = state.metaTags[key];
  if (patch.before && current && current !== patch.before) {
    return {
      ...base,
      outcome: "drift",
      reason: `metaTags[${key}] = "${current.slice(0, 40)}…" ≠ patch.before`,
    };
  }

  const nextMeta = { ...state.metaTags, [key]: patch.after };
  const nextHtml = rewriteMetaInHtml(state.html, key, patch.after);

  return {
    ...base,
    metaTags: nextMeta,
    html: nextHtml,
    outcome: "applied",
    reason: `meta[${key}] updated`,
  };
}

function editJsonLdField(
  base: Omit<HandlerResult, "outcome">,
  state: HandlerState,
  patch: NonNullable<Instruction["patch"]>,
): HandlerResult {
  // target format: "<@type>.<dot.path>" e.g. "BlogPosting.author.name"
  const dot = patch.target.indexOf(".");
  if (dot === -1) {
    return { ...base, outcome: "skipped", reason: `target missing field path: ${patch.target}` };
  }
  const typeName = patch.target.slice(0, dot);
  const fieldPath = patch.target.slice(dot + 1).split(".");

  const graph = normalizeGraph(state.jsonLd);
  const node = graph.find(
    (n) => typeof n === "object" && n !== null && matchesType((n as Record<string, unknown>)["@type"], typeName),
  ) as Record<string, unknown> | undefined;

  if (!node) {
    return { ...base, outcome: "drift", reason: `no JSON-LD node with @type=${typeName}` };
  }

  const currentValue = getByPath(node, fieldPath);
  if (patch.before && currentValue !== undefined && String(currentValue) !== patch.before) {
    return {
      ...base,
      outcome: "drift",
      reason: `${patch.target} = "${String(currentValue).slice(0, 40)}…" ≠ patch.before`,
    };
  }

  setByPath(node, fieldPath, patch.after);

  const nextJsonLd = rebuildJsonLd(state.jsonLd, graph);
  const nextHtml = rewriteJsonLdInHtml(state.html, nextJsonLd);

  return {
    ...base,
    jsonLd: nextJsonLd,
    html: nextHtml,
    outcome: "applied",
    reason: `${patch.target} set`,
  };
}

// ─── helpers ────────────────────────────────────────────────────────────────

export function normalizeGraph(
  jsonLd: Record<string, unknown> | unknown[],
): unknown[] {
  if (Array.isArray(jsonLd)) return jsonLd;
  const g = (jsonLd as { "@graph"?: unknown })["@graph"];
  if (Array.isArray(g)) return g;
  return [jsonLd];
}

function rebuildJsonLd(
  original: Record<string, unknown> | unknown[],
  graph: unknown[],
): Record<string, unknown> | unknown[] {
  if (Array.isArray(original)) return graph;
  if (typeof original === "object" && original && "@graph" in original) {
    return { ...original, "@graph": graph };
  }
  return graph[0] && typeof graph[0] === "object"
    ? (graph[0] as Record<string, unknown>)
    : original;
}

function matchesType(t: unknown, name: string): boolean {
  if (typeof t === "string") return t === name;
  if (Array.isArray(t)) return t.includes(name);
  return false;
}

function getByPath(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur && typeof cur === "object") {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return cur;
}

function setByPath(obj: Record<string, unknown>, path: string[], value: unknown): void {
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    if (!cur[key] || typeof cur[key] !== "object") cur[key] = {};
    cur = cur[key] as Record<string, unknown>;
  }
  cur[path[path.length - 1]!] = value;
}

function rewriteMetaInHtml(html: string, key: string, value: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Try property="", name="", http-equiv="" in that order.
  for (const attr of ["property", "name", "http-equiv"]) {
    const re = new RegExp(
      `(<meta\\s+[^>]*${attr}\\s*=\\s*["']${escapedKey}["'][^>]*content\\s*=\\s*["'])([^"']*)(["'][^>]*>)`,
      "i",
    );
    if (re.test(html)) return html.replace(re, (_m, a, _b, c) => `${a}${escapeAttr(value)}${c}`);
    // content="" may precede property/name
    const reRev = new RegExp(
      `(<meta\\s+[^>]*content\\s*=\\s*["'])([^"']*)(["'][^>]*${attr}\\s*=\\s*["']${escapedKey}["'][^>]*>)`,
      "i",
    );
    if (reRev.test(html)) return html.replace(reRev, (_m, a, _b, c) => `${a}${escapeAttr(value)}${c}`);
  }
  if (key === "title") {
    return html.replace(/<title>([\s\S]*?)<\/title>/i, `<title>${escapeHtml(value)}</title>`);
  }
  if (key === "canonical") {
    return html.replace(
      /(<link\s+[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["'])([^"']*)(["'])/i,
      (_m, a, _b, c) => `${a}${escapeAttr(value)}${c}`,
    );
  }
  // Tag not present — inject into <head>.
  const metaTag = `<meta ${/^og:|^article:/.test(key) ? "property" : "name"}="${escapeAttr(
    key,
  )}" content="${escapeAttr(value)}">`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}\n  ${metaTag}`);
  }
  return `${metaTag}\n${html}`;
}

function rewriteJsonLdInHtml(
  html: string,
  jsonLd: Record<string, unknown> | unknown[],
): string {
  const serialized = JSON.stringify(jsonLd, null, 2);
  const re = /<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/i;
  if (re.test(html)) {
    return html.replace(re, `<script type="application/ld+json">\n${serialized}\n</script>`);
  }
  // Inject before </head>.
  const injection = `<script type="application/ld+json">\n${serialized}\n</script>`;
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${injection}\n</head>`);
  }
  return `${html}\n${injection}`;
}

function escapeAttr(v: string): string {
  return v.replace(/"/g, "&quot;");
}

function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
