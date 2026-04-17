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
exports.parseBladeFile = parseBladeFile;
const fs = __importStar(require("fs"));
function parseBladeFile(filePath) {
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    }
    catch {
        return { props: [], slots: [] };
    }
    return {
        props: parseProps(content),
        slots: parseSlots(content),
    };
}
function parseProps(content) {
    const match = content.match(/@props\(\[([\s\S]*?)\]\)/);
    if (!match) {
        return [];
    }
    const block = match[1];
    const lines = block.split('\n');
    const props = [];
    let pendingComments = [];
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
function parsePropLine(line, pendingComments) {
    // Strip trailing comma before processing
    const stripped = line.replace(/,\s*$/, '').trim();
    if (!stripped) {
        return null;
    }
    const arrowIdx = stripped.indexOf('=>');
    if (arrowIdx >= 0) {
        // "key" => value  // optional comment
        const keyRaw = stripped.slice(0, arrowIdx).trim().replace(/['"]/g, '');
        const rest = stripped.slice(arrowIdx + 2).trim();
        const commentIdx = rest.indexOf('//');
        let value;
        let inlineComment = null;
        if (commentIdx >= 0) {
            value = rest.slice(0, commentIdx).trim();
            inlineComment = rest.slice(commentIdx + 2).trim() || null;
        }
        else {
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
    }
    else {
        // "key"  (no default = required)
        const commentIdx = stripped.indexOf('//');
        let keyRaw;
        let inlineComment = null;
        if (commentIdx >= 0) {
            keyRaw = stripped.slice(0, commentIdx).trim().replace(/['"]/g, '');
            inlineComment = stripped.slice(commentIdx + 2).trim() || null;
        }
        else {
            keyRaw = stripped.replace(/['"]/g, '');
        }
        if (!keyRaw) {
            return null;
        }
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
function parseSlots(content) {
    const slots = [];
    const seen = new Set();
    // Default slot
    if (/\{\{\s*\$slot\s*\}\}/.test(content)) {
        slots.push({ name: 'default', description: null });
        seen.add('default');
    }
    // Variables defined in @props — not slots
    const propNames = new Set(parseProps(content).map(p => p.name));
    // Variables assigned inside @php blocks — not slots
    const phpVarNames = new Set();
    for (const phpMatch of content.matchAll(/@php([\s\S]*?)@endphp/g)) {
        for (const varMatch of phpMatch[1].matchAll(/\$(\w+)\s*=/g)) {
            phpVarNames.add(varMatch[1]);
        }
    }
    // isset($varName) where var is not a prop and not a php-assigned var → named slot
    for (const match of content.matchAll(/isset\(\$(\w+)\)/g)) {
        const name = match[1];
        if (name === 'slot') {
            continue;
        }
        if (seen.has(name)) {
            continue;
        }
        if (propNames.has(name)) {
            continue;
        }
        if (phpVarNames.has(name)) {
            continue;
        }
        slots.push({ name, description: null });
        seen.add(name);
    }
    return slots;
}
//# sourceMappingURL=bladeParser.js.map