import * as vscode from 'vscode';
import { ComponentMeta, PropMeta } from '../types';

const BLADE_SELECTOR: vscode.DocumentSelector = { pattern: '**/*.blade.php' };

export function createCompletionProvider(getComponents: () => ComponentMeta[]): vscode.Disposable[] {
    return [
        createTagCompletionProvider(getComponents),
        createPropCompletionProvider(getComponents),
    ];
}

function createTagCompletionProvider(getComponents: () => ComponentMeta[]): vscode.Disposable {
    return vscode.languages.registerCompletionItemProvider(
        BLADE_SELECTOR,
        {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.slice(0, position.character);

                const match = linePrefix.match(/<x-([\w-]*(?:::[\w.]*)?)$/);
                if (!match) { return undefined; }

                const startChar = position.character - match[1].length;
                const replaceRange = new vscode.Range(
                    position.line, startChar,
                    position.line, position.character
                );

                return getComponents().map(meta => buildTagCompletionItem(meta, replaceRange));
            },
        },
        '<', '-', ':'
    );
}

function createPropCompletionProvider(getComponents: () => ComponentMeta[]): vscode.Disposable {
    return vscode.languages.registerCompletionItemProvider(
        BLADE_SELECTOR,
        {
            provideCompletionItems(document, position) {
                const meta = getTagContextAtPosition(document, position, getComponents);
                if (!meta) { return undefined; }

                const usedProps = getUsedProps(document, position);

                return meta.props
                    .filter(p => !usedProps.has(p.name))
                    .map(prop => buildPropCompletionItem(prop));
            },
        },
        ' ', ':'
    );
}

function getTagContextAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    getComponents: () => ComponentMeta[]
): ComponentMeta | null {
    const startLine = Math.max(0, position.line - 10);
    let text = '';
    for (let i = startLine; i <= position.line; i++) {
        const line = document.lineAt(i).text;
        text += (i === position.line ? line.slice(0, position.character) : line) + '\n';
    }

    // Find last unclosed opening tag
    const lastTagIdx = text.lastIndexOf('<x-');
    if (lastTagIdx < 0) { return null; }

    const fromTag = text.slice(lastTagIdx);

    // Already closed with > — not inside a tag
    if (/^<x-[\w-]+::[\w.]+[^>]*>/.test(fromTag)) { return null; }

    const tagMatch = fromTag.match(/^<x-([\w-]+)::([\w.]+)/);
    if (!tagMatch) { return null; }

    const tag = `${tagMatch[1]}::${tagMatch[2]}`;
    return getComponents().find(c => c.tag === tag) ?? null;
}

function getUsedProps(document: vscode.TextDocument, position: vscode.Position): Set<string> {
    const startLine = Math.max(0, position.line - 10);
    let text = '';
    for (let i = startLine; i <= position.line; i++) {
        const line = document.lineAt(i).text;
        text += (i === position.line ? line.slice(0, position.character) : line) + '\n';
    }

    const lastTagIdx = text.lastIndexOf('<x-');
    const tagText = lastTagIdx >= 0 ? text.slice(lastTagIdx) : '';

    const used = new Set<string>();
    for (const m of tagText.matchAll(/:?([\w-]+)=/g)) {
        used.add(m[1]);
    }
    return used;
}

function buildTagCompletionItem(meta: ComponentMeta, range: vscode.Range): vscode.CompletionItem {
    const item = new vscode.CompletionItem(
        `x-${meta.tag}`,
        vscode.CompletionItemKind.Class
    );

    item.range = range;
    item.detail = meta.packageName;
    item.documentation = buildTagDocMarkdown(meta);
    item.insertText = buildTagSnippet(meta);
    item.filterText = meta.tag;

    return item;
}

function buildPropCompletionItem(prop: PropMeta): vscode.CompletionItem {
    const item = new vscode.CompletionItem(prop.name, vscode.CompletionItemKind.Property);

    item.detail = prop.type ?? (prop.required ? 'required' : 'optional');
    item.documentation = buildPropDocMarkdown(prop);
    item.insertText = new vscode.SnippetString(`:${prop.name}="\${1:}"`);
    item.sortText = prop.required ? `0_${prop.name}` : `1_${prop.name}`;

    return item;
}

function buildTagSnippet(meta: ComponentMeta): vscode.SnippetString {
    const requiredProps = meta.props.filter(p => p.required);
    const propsLines = requiredProps.map((prop, i) => `    :${prop.name}="\${${i + 1}:}"`);

    if (meta.selfClosing) {
        if (propsLines.length === 0) {
            return new vscode.SnippetString(`${meta.tag} />`);
        }
        return new vscode.SnippetString(`${meta.tag}\n${propsLines.join('\n')}\n/>`);
    }

    const slotIdx = requiredProps.length + 1;
    if (propsLines.length === 0) {
        return new vscode.SnippetString(`${meta.tag}>\n    \${${slotIdx}:}\n</x-${meta.tag}>`);
    }
    return new vscode.SnippetString(
        `${meta.tag}\n${propsLines.join('\n')}\n>\n    \${${slotIdx}:}\n</x-${meta.tag}>`
    );
}

function buildTagDocMarkdown(meta: ComponentMeta): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    if (meta.description) {
        md.appendMarkdown(`${meta.description}\n\n`);
    }

    if (meta.props.length > 0) {
        md.appendMarkdown('**Props**\n\n');
        md.appendMarkdown('| Prop | Type | Default | Description |\n');
        md.appendMarkdown('|------|------|---------|-------------|\n');

        for (const prop of meta.props) {
            const name = prop.required ? `**\`${prop.name}\`**` : `\`${prop.name}\``;
            const type = prop.type ? `\`${prop.type}\`` : '—';
            const def  = prop.default !== null ? `\`${prop.default}\`` : '—';
            const desc = prop.description ?? '';
            md.appendMarkdown(`| ${name} | ${type} | ${def} | ${desc} |\n`);
        }

        md.appendMarkdown('\n');
    }

    if (meta.slots.length > 0) {
        md.appendMarkdown('**Slots:** ');
        md.appendMarkdown(meta.slots.map(s => `\`${s.name}\``).join('  ·  '));
        md.appendMarkdown('\n');
    }

    return md;
}

function buildPropDocMarkdown(prop: PropMeta): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    if (prop.type) { md.appendMarkdown(`**Type:** \`${prop.type}\`\n\n`); }
    if (prop.default !== null) { md.appendMarkdown(`**Default:** \`${prop.default}\`\n\n`); }
    if (prop.description) { md.appendMarkdown(prop.description); }
    return md;
}
