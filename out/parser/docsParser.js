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
exports.mergeDocsIntoMeta = mergeDocsIntoMeta;
const fs = __importStar(require("fs"));
function mergeDocsIntoMeta(meta) {
    const docsPath = meta.filePath.replace(/\.blade\.php$/, '.docs.json');
    if (!fs.existsSync(docsPath)) {
        return meta;
    }
    let docs;
    try {
        docs = JSON.parse(fs.readFileSync(docsPath, 'utf-8'));
    }
    catch {
        return meta;
    }
    const description = docs.description ?? meta.description;
    const props = meta.props.map(prop => {
        const docProp = docs.props?.[prop.name];
        if (!docProp) {
            return prop;
        }
        return {
            ...prop,
            type: docProp.type ?? prop.type,
            default: docProp.default ?? prop.default,
            description: docProp.description ?? prop.description,
        };
    });
    const slots = meta.slots.map(slot => {
        const docSlot = docs.slots?.[slot.name];
        return {
            ...slot,
            description: docSlot ?? slot.description,
        };
    });
    const selfClosing = docs.selfClosing ?? meta.selfClosing;
    return { ...meta, description, props, slots, selfClosing };
}
//# sourceMappingURL=docsParser.js.map