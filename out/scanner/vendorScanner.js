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
exports.scanComponents = scanComponents;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const bladeParser_1 = require("../parser/bladeParser");
const docsParser_1 = require("../parser/docsParser");
const serviceProviderParser_1 = require("./serviceProviderParser");
async function scanComponents(workspaceRoot) {
    const solarisRoot = path.join(workspaceRoot, 'vendor', 'solaris');
    if (!fs.existsSync(solarisRoot)) {
        return [];
    }
    const prefixMap = await (0, serviceProviderParser_1.extractPrefixMap)(workspaceRoot);
    const pattern = new vscode.RelativePattern(vscode.Uri.file(solarisRoot), '*/resources/views/components/**/*.blade.php');
    const uris = await vscode.workspace.findFiles(pattern);
    const components = [];
    for (const uri of uris) {
        const filePath = uri.fsPath;
        const relative = path.relative(solarisRoot, filePath);
        // relative = "solaris-laravel-core/resources/views/components/button.blade.php"
        const parts = relative.split(path.sep);
        const packageDir = parts[0];
        const prefix = prefixMap.get(packageDir);
        if (!prefix) {
            continue;
        }
        // Derive component name from path after "components/"
        const componentsMarker = ['resources', 'views', 'components'];
        const markerIdx = parts.findIndex((_, i) => parts[i] === 'resources' && parts[i + 1] === 'views' && parts[i + 2] === 'components');
        if (markerIdx < 0) {
            continue;
        }
        const nameParts = parts.slice(markerIdx + componentsMarker.length);
        const lastName = nameParts[nameParts.length - 1].replace(/\.blade\.php$/, '');
        nameParts[nameParts.length - 1] = lastName;
        const name = nameParts.join('.');
        const { props, slots } = (0, bladeParser_1.parseBladeFile)(filePath);
        let meta = {
            name,
            prefix,
            tag: `${prefix}::${name}`,
            packageName: packageDir,
            filePath,
            props,
            slots,
            description: null,
            selfClosing: slots.length === 0,
        };
        meta = (0, docsParser_1.mergeDocsIntoMeta)(meta);
        components.push(meta);
    }
    return components;
}
//# sourceMappingURL=vendorScanner.js.map