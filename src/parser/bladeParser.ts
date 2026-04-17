import * as fs from 'fs';
import { PropMeta, SlotMeta } from '../types';

export interface BladeParseResult {
    props: PropMeta[];
    slots: SlotMeta[];
}

export function parseBladeFile(filePath: string): BladeParseResult {
    let content: string;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    } catch {
        return { props: [], slots: [] };
    }
    return {
        props: parseProps(content),
        slots: parseSlots(content),
    };
}

function parseProps(content: string): PropMeta[] {
    const match = content.match(/@props\(\[([\s\S]*?)\]\)/);
    if (!match) { return []; }

    const block = match[1];
    const lines = block.split('\n');
    const props: PropMeta[] = [];
    let pendingComments: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
            pendingComments = [];
            continue;
        }

        if (trimmed.startsWith('//')) {
            pendingComments.push(trimmed.slice(2).trim());
            continue;
        }

        const prop = parsePropLine(trimmed, pendingComments);
        if (prop) {
            props.push(prop);
        }
        pendingComments = [];
    }

    return props;
}

function parsePropLine(line: string, pendingComments: string[]): PropMeta | null {
    // Strip trailing comma before processing
    const stripped = line.replace(/,\s*$/, '').trim();
    if (!stripped) { return null; }

    const arrowIdx = stripped.indexOf('=>');

    if (arrowIdx >= 0) {
        // "key" => value  // optional comment
        const keyRaw = stripped.slice(0, arrowIdx).trim().replace(/['"]/g, '');
        const rest = stripped.slice(arrowIdx + 2).trim();

        const commentIdx = rest.indexOf('//');
        let value: string;
        let inlineComment: string | null = null;

        if (commentIdx >= 0) {
            value = rest.slice(0, commentIdx).trim();
            inlineComment = rest.slice(commentIdx + 2).trim() || null;
        } else {
            value = rest;
        }

        const description = inlineComment
            ?? (pendingComments.length > 0 ? pendingComments.join(' | ') : null);

        return {
            name: keyRaw,
            type: null,
            default: value || null,
            required: false,
            description,
        };
    } else {
        // "key"  (no default = required)
        const commentIdx = stripped.indexOf('//');
        let keyRaw: string;
        let inlineComment: string | null = null;

        if (commentIdx >= 0) {
            keyRaw = stripped.slice(0, commentIdx).trim().replace(/['"]/g, '');
            inlineComment = stripped.slice(commentIdx + 2).trim() || null;
        } else {
            keyRaw = stripped.replace(/['"]/g, '');
        }

        if (!keyRaw) { return null; }

        const description = inlineComment
            ?? (pendingComments.length > 0 ? pendingComments.join(' | ') : null);

        return {
            name: keyRaw,
            type: null,
            default: null,
            required: true,
            description,
        };
    }
}

function parseSlots(content: string): SlotMeta[] {
    const slots: SlotMeta[] = [];
    const seen = new Set<string>();

    // Default slot
    if (/\{\{\s*\$slot\s*\}\}/.test(content)) {
        slots.push({ name: 'default', description: null });
        seen.add('default');
    }

    // Variables defined in @props — not slots
    const propNames = new Set(parseProps(content).map(p => p.name));

    // Variables assigned inside @php blocks — not slots
    const phpVarNames = new Set<string>();
    for (const phpMatch of content.matchAll(/@php([\s\S]*?)@endphp/g)) {
        for (const varMatch of phpMatch[1].matchAll(/\$(\w+)\s*=/g)) {
            phpVarNames.add(varMatch[1]);
        }
    }

    // isset($varName) where var is not a prop and not a php-assigned var → named slot
    for (const match of content.matchAll(/isset\(\$(\w+)\)/g)) {
        const name = match[1];
        if (name === 'slot') { continue; }
        if (seen.has(name)) { continue; }
        if (propNames.has(name)) { continue; }
        if (phpVarNames.has(name)) { continue; }
        slots.push({ name, description: null });
        seen.add(name);
    }

    return slots;
}
