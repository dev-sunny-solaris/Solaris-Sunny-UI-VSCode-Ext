import * as vscode from 'vscode';
import { ComponentMeta } from '../types';

const BLADE_SELECTOR: vscode.DocumentSelector = { pattern: '**/*.blade.php' };

export function createHoverProvider(getComponents: () => ComponentMeta[]): vscode.Disposable {
    return vscode.languages.registerHoverProvider(BLADE_SELECTOR, {
        provideHover(document, position) {
            const range = document.getWordRangeAtPosition(position, /x-[\w-]+::[\w.]+/);
            if (!range) { return undefined; }

            const word = document.getText(range);
            const match = word.match(/^x-([\w-]+)::([\w.]+)$/);
            if (!match) { return undefined; }

            const [, prefix, name] = match;
            const tag = `${prefix}::${name}`;
            const meta = getComponents().find(c => c.tag === tag);

            if (!meta) { return undefined; }

            return new vscode.Hover(buildHoverMarkdown(meta), range);
        },
    });
}

function buildHoverMarkdown(meta: ComponentMeta): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    md.appendMarkdown(`### \`<x-${meta.tag}>\`\n`);
    md.appendMarkdown(`*${meta.packageName}*\n\n`);

    if (meta.description) {
        md.appendMarkdown(`${meta.description}\n\n`);
    }

    if (meta.props.length > 0) {
        md.appendMarkdown('---\n\n');
        md.appendMarkdown('| Prop | Type | Default | Description |\n');
        md.appendMarkdown('|------|------|---------|-------------|\n');

        const sorted = [...meta.props].sort((a, b) =>
            (b.required ? 1 : 0) - (a.required ? 1 : 0)
        );

        for (const prop of sorted) {
            const name = prop.required ? `**\`${prop.name}\`** ✦` : `\`${prop.name}\``;
            const type = prop.type ? `\`${prop.type}\`` : '—';
            const def  = prop.default !== null ? `\`${prop.default}\`` : '—';
            const desc = prop.description ?? '';
            md.appendMarkdown(`| ${name} | ${type} | ${def} | ${desc} |\n`);
        }

        md.appendMarkdown('\n');
    }

    if (meta.slots.length > 0) {
        md.appendMarkdown('---\n\n');
        md.appendMarkdown('**Slots:** ');
        md.appendMarkdown(meta.slots.map(s => `\`${s.name}\``).join('  ·  '));
        md.appendMarkdown('\n');
    }

    return md;
}
