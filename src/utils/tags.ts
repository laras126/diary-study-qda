import { Tag } from '../types';

export function isChildTag(tag: Tag): boolean {
  return tag.name.includes('/');
}

export function getEffectiveColor(tag: Tag, allTags: Tag[]): string {
  const i = tag.name.indexOf('/');
  if (i === -1) return tag.color;
  const parentName = tag.name.slice(0, i);
  const parent = allTags.find((t) => t.name === parentName);
  return parent?.color ?? tag.color;
}

export function parseTagName(name: string): { parent: string | null; child: string } {
  const i = name.indexOf(' / ');
  return i === -1
    ? { parent: null, child: name }
    : { parent: name.slice(0, i), child: name.slice(i + 3) };
}

export type TagGrouping =
  | { type: 'group'; parent: string; tags: Tag[] }
  | { type: 'standalone'; tag: Tag };

export function groupTags(tags: Tag[]): TagGrouping[] {
  const parentMap = new Map<string, Tag[]>();
  const standalone: Tag[] = [];

  for (const tag of tags) {
    const { parent } = parseTagName(tag.name);
    if (parent === null) {
      standalone.push(tag);
    } else {
      if (!parentMap.has(parent)) parentMap.set(parent, []);
      parentMap.get(parent)!.push(tag);
    }
  }

  const result: TagGrouping[] = [];

  const sortedParents = [...parentMap.keys()].sort((a, b) => a.localeCompare(b));
  for (const parent of sortedParents) {
    result.push({ type: 'group', parent, tags: parentMap.get(parent)! });
  }

  for (const tag of standalone) {
    result.push({ type: 'standalone', tag });
  }

  return result;
}

export function getParentNames(tags: Tag[]): string[] {
  const parents = new Set<string>();
  for (const tag of tags) {
    const { parent } = parseTagName(tag.name);
    if (parent !== null) parents.add(parent);
  }
  return [...parents].sort((a, b) => a.localeCompare(b));
}
