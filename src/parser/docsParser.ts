import * as fs from 'fs';
import * as path from 'path';
import { PropMeta, SlotMeta, ComponentMeta } from '../types';

interface DocsPropEntry {
    type?: string;
    default?: string;
    description?: string;
}

interface DocsFile {
    description?: string;
    selfClosing?: boolean;
    props?: Record<string, DocsPropEntry>;
    slots?: Record<string, string>;
}

export function mergeDocsIntoMeta(meta: ComponentMeta): ComponentMeta {
    const docsPath = meta.filePath.replace(/\.blade\.php$/, '.docs.json');

    if (!fs.existsSync(docsPath)) {
        return meta;
    }

    let docs: DocsFile;
    try {
        docs = JSON.parse(fs.readFileSync(docsPath, 'utf-8')) as DocsFile;
    } catch {
        return meta;
    }

    const description = docs.description ?? meta.description;

    const props: PropMeta[] = meta.props.map(prop => {
        const docProp = docs.props?.[prop.name];
        if (!docProp) { return prop; }
        return {
            ...prop,
            type: docProp.type ?? prop.type,
            default: docProp.default ?? prop.default,
            description: docProp.description ?? prop.description,
        };
    });

    const slots: SlotMeta[] = meta.slots.map(slot => {
        const docSlot = docs.slots?.[slot.name];
        return {
            ...slot,
            description: docSlot ?? slot.description,
        };
    });

    const selfClosing = docs.selfClosing ?? meta.selfClosing;

    return { ...meta, description, props, slots, selfClosing };
}
