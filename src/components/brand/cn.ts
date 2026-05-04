/**
 * cn — class merger minimal.
 * Filtra falsy, junta strings, deduplica espacios. Sin clsx/twMerge:
 * mantenemos el rebrand sin nuevas deps.
 */
export function cn(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
