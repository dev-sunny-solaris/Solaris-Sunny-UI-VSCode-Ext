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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const vendorScanner_1 = require("./scanner/vendorScanner");
const completionProvider_1 = require("./providers/completionProvider");
const hoverProvider_1 = require("./providers/hoverProvider");
let components = [];
async function activate(context) {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
        return;
    }
    await refresh(workspaceRoot);
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.Uri.file(path.join(workspaceRoot, 'vendor', 'solaris')), '**/*.blade.php'));
    const rescan = () => refresh(workspaceRoot);
    watcher.onDidCreate(rescan);
    watcher.onDidChange(rescan);
    watcher.onDidDelete(rescan);
    context.subscriptions.push(watcher, ...(0, completionProvider_1.createCompletionProvider)(() => components), (0, hoverProvider_1.createHoverProvider)(() => components));
}
function deactivate() {
    components = [];
}
async function refresh(workspaceRoot) {
    try {
        components = await (0, vendorScanner_1.scanComponents)(workspaceRoot);
    }
    catch (err) {
        console.error('[Solar UI] Scan failed:', err);
    }
}
function getWorkspaceRoot() {
    const folders = vscode.workspace.workspaceFolders;
    return folders && folders.length > 0 ? folders[0].uri.fsPath : undefined;
}
//# sourceMappingURL=extension.js.map