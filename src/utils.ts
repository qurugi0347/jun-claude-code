/**
 * Extract a command-based key from a hook entry for duplicate detection.
 * Includes the matcher field so that entries with the same command but different matchers
 * are treated as distinct items.
 *
 * Type 1 (nested): { matcher?: "...", hooks: [{ type: "command", command: "..." }, ...] }
 *   -> returns "[matcher]type:command\ntype:command" (sorted) or "type:command\ntype:command" if no matcher
 *
 * Type 2 (flat): { type: "command", command: "..." }
 *   -> returns "type:command"
 */
export const getHookKey = (entry: any): string => {
  const matcher = entry.matcher || '';
  if (entry.hooks && Array.isArray(entry.hooks)) {
    const hooksKey = entry.hooks
      .map((h: any) => `${h.type || ''}:${h.command || ''}`)
      .sort()
      .join('\n');
    return matcher ? `[${matcher}]${hooksKey}` : hooksKey;
  }
  return `${entry.type || ''}:${entry.command || ''}`;
};
