"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHoverProvider = createHoverProvider;
const vscode = __importStar(require("vscode"));
const BLADE_SELECTOR = { pattern: '**/*.blade.php' };
function createHoverProvider(getComponents) {
    return vscode.languages.registerHoverProvider(BLADE_SELECTOR, {
        provideHover(document, position) {
            const range = document.getWordRangeAtPosition(position, /x-[\w-]+::[\w.]+/);
            if (!range) {
                return undefined;
            }
            const word = document.getText(range);
            const match = word.match(/^x-([\w-]+)::([\w.]+)$/);
            if (!match) {
                return undefined;
            }
            const [, prefix, name] = match;
            const tag = `${prefix}::${name}`;
            const meta = getComponents().find(c => c.tag === tag);
            if (!meta) {
                return undefined;
            }
            return new vscode.Hover(buildHoverMarkdown(meta), range);
        },
    });
}
function buildHoverMarkdown(meta) {
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
        const sorted = [...meta.props].sort((a, b) => (b.required ? 1 : 0) - (a.required ? 1 : 0));
        for (const prop of sorted) {
            const name = prop.required ? `**\`${prop.name}\`** ✦` : `\`${prop.name}\``;
            const type = prop.type ? `\`${prop.type}\`` : '—';
            const def = prop.default !== null ? `\`${prop.default}\`` : '—';
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
//# sourceMappingURL=hoverProvider.js.map