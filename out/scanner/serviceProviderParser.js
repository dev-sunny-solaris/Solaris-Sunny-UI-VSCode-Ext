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
exports.extractPrefixMap = extractPrefixMap;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
/**
 * Scan vendor/solaris/* for Spatie ServiceProviders and extract blade prefix.
 * Returns a map of package-directory-name → blade-prefix.
 */
async function extractPrefixMap(workspaceRoot) {
    const map = new Map();
    const solarisRoot = path.join(workspaceRoot, 'vendor', 'solaris');
    if (!fs.existsSync(solarisRoot)) {
        return map;
    }
    const pattern = new vscode.RelativePattern(vscode.Uri.file(solarisRoot), '*/src/**/*ServiceProvider.php');
    const uris = await vscode.workspace.findFiles(pattern);
    for (const uri of uris) {
        try {
            const content = fs.readFileSync(uri.fsPath, 'utf-8');
            const prefixMatch = content.match(/->hasViews\(['"]([^'"]+)['"]\)/);
            if (!prefixMatch) {
                continue;
            }
            const prefix = prefixMatch[1];
            // Derive package dir name from path: vendor/solaris/<packageDir>/src/...
            const relative = path.relative(solarisRoot, uri.fsPath);
            const packageDir = relative.split(path.sep)[0];
            map.set(packageDir, prefix);
        }
        catch {
            // skip unreadable files
        }
    }
    return map;
}
//# sourceMappingURL=serviceProviderParser.js.map