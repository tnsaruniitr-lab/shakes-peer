import type { HandlerResult, HandlerState, Instruction } from "./types.js";
import { normalizeGraph } from "./edit-schema.js";

// ─────────────────────────────────────────────────────────────────────────────
// insert_missing handler
//
// Used when blog-buster detects a missing JSON-LD entity or a missing
// content-level block. Two modes:
//
// 1. SCHEMA INSERTION
//    patch.target = "jsonld:<@type>" (e.g. "jsonld:FAQPage")
//    patch.after  = JSON-stringified entity
//    → parse & append to @graph (dedupe by @type+@id)
//
// 2. HTML INSERTION
//    patch.target = a CSS-ish anchor like "after:<article>" or "before:<h2>"
//    patch.after  = HTML fragment
//    → insert at first matching anchor; if none found, append inside <article>/<main>.
//
// Both paths fail-soft (skipped, not failed) so the outer loop can escalate.
// ─────────────────────────────────────────────────────────────────────────────

export function insertMissingHandler(
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
  if (!patch.after || !patch.after.trim()) {
    return { ...base, outcome: "skipped", reason: "empty after payload" };
  }

  if (patch.target.startsWith("jsonld:") || patch.type === "insert_schema") {
    return insertSchema(base, state, patch);
  }

  return insertHtml(base, state, patch);
}

function insertSchema(
  base: Omit<HandlerResult, "outcome">,
  state: HandlerState,
  patch: NonNullable<Instruction["patch"]>,
): HandlerResult {
  let entity: unknown;
  try {
    entity = JSON.parse(patch.after);
  } catch {
    return { ...base, outcome: "skipped", reason: "patch.after is not valid JSON" };
  }
  if (!entity || typeof entity !== "object") {
    return { ...base, outcome: "skipped", reason: "entity is not an object" };
  }
  const entityType = (entity as Record<string, unknown>)["@type"];
  if (!entityType) {
    return { ...base, outcome: "skipped", reason: "entity missing @type" };
  }

  const graph = [...normalizeGraph(state.jsonLd)];
  // Dedupe: if a node of same @type and same @id already exists, replace it
  // instead of appending.
  const newId = (entity as Record<string, unknown>)["@id"];
  const dupeIdx = graph.findIndex(
    (n) =>
      typeof n === "object" &&
      n !== null &&
      typesMatch((n as Record<string, unknown>)["@type"], entityType) &&
      (newId === undefined ||
        (n as Record<string, unknown>)["@id"] === undefined ||
        (n as Record<string, unknown>)["@id"] === newId),
  );
  if (dupeIdx >= 0) {
    graph[dupeIdx] = entity;
  } else {
    graph.push(entity);
  }

  const nextJsonLd = wrapIfGraph(state.jsonLd, graph);
  const nextHtml = rewriteJsonLdInHtml(state.html, nextJsonLd);

  return {
    ...base,
    jsonLd: nextJsonLd,
    html: nextHtml,
    outcome: "applied",
    reason: dupeIdx >= 0 ? `@type=${String(entityType)} replaced` : `@type=${String(entityType)} appended`,
  };
}

function insertHtml(
  base: Omit<HandlerResult, "outcome">,
  state: HandlerState,
  patch: NonNullable<Instruction["patch"]>,
): HandlerResult {
  const target = patch.target;
  const payload = patch.after;

  // after:<selector> / before:<selector> anchors (exact tag name match).
  const anchorMatch = /^(after|before):(.+)$/.exec(target);
  if (anchorMatch) {
    const [, pos, sel] = anchorMatch;
    const html = insertAtAnchor(state.html, sel!.trim(), payload, pos as "after" | "before");
    if (html) {
      return { ...base, html, outcome: "applied", reason: `inserted ${pos} ${sel}` };
    }
  }

  // Fallback: append inside <article> or <main>.
  const fallback = appendInsideContainer(state.html, payload);
  if (fallback) {
    return { ...base, html: fallback, outcome: "applied", reason: "appended inside <article>/<main>" };
  }

  return { ...base, outcome: "skipped", reason: `could not locate insertion anchor: ${target}` };
}

// ─── dom-free helpers (regex, good enough for our generated HTML) ──────────

function insertAtAnchor(
  html: string,
  selector: string,
  payload: string,
  pos: "after" | "before",
): string | null {
  // Extract bare tag name from "<h2>" / "h2" / "h2.intro" (ignore classes).
  const tagMatch = /^<?([a-zA-Z][a-zA-Z0-9]*)/.exec(selector);
  if (!tagMatch) return null;
  const tag = tagMatch[1]!;
  const openRe = new RegExp(`<${tag}\\b[^>]*>`, "i");
  const closeRe = new RegExp(`</${tag}>`, "i");

  if (pos === "before") {
    const m = openRe.exec(html);
    if (!m) return null;
    return html.slice(0, m.index) + payload + "\n" + html.slice(m.index);
  }

  // "after" = after the matching CLOSE tag (so we don't inject inside the target).
  const openIdx = openRe.exec(html)?.index;
  if (openIdx === undefined) return null;
  const rest = html.slice(openIdx);
  const closeMatch = closeRe.exec(rest);
  if (!closeMatch) return null;
  const insertAt = openIdx + closeMatch.index + closeMatch[0].length;
  return html.slice(0, insertAt) + "\n" + payload + html.slice(insertAt);
}

function appendInsideContainer(html: string, payload: string): string | null {
  for (const tag of ["article", "main", "body"]) {
    const re = new RegExp(`</${tag}>`, "i");
    const m = re.exec(html);
    if (m) {
      return html.slice(0, m.index) + "\n" + payload + "\n" + html.slice(m.index);
    }
  }
  return null;
}

function typesMatch(a: unknown, b: unknown): boolean {
  const norm = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(String) : v != null ? [String(v)] : [];
  const A = norm(a);
  const B = norm(b);
  return A.some((x) => B.includes(x));
}

function wrapIfGraph(
  original: Record<string, unknown> | unknown[],
  graph: unknown[],
): Record<string, unknown> | unknown[] {
  if (Array.isArray(original)) return graph;
  if (typeof original === "object" && original && "@graph" in original) {
    return { ...original, "@graph": graph };
  }
  // Promote to a graph wrapper so later nodes can be added.
  return { "@context": "https://schema.org", "@graph": graph };
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
  const injection = `<script type="application/ld+json">\n${serialized}\n</script>`;
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${injection}\n</head>`);
  }
  return `${html}\n${injection}`;
}
