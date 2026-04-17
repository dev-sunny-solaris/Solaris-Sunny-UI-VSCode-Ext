import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Scan vendor/solaris/* for Spatie ServiceProviders and extract blade prefix.
 * Returns a map of package-directory-name → blade-prefix.
 */
export async function extractPrefixMap(workspaceRoot: string): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const solarisRoot = path.join(workspaceRoot, 'vendor', 'solaris');

    if (!fs.existsSync(solarisRoot)) {
        return map;
    }

    const pattern = new vscode.RelativePattern(
        vscode.Uri.file(solarisRoot),
        '*/src/**/*ServiceProvider.php'
    );

    const uris = await vscode.workspace.findFiles(pattern);

    for (const uri of uris) {
        try {
            const content = fs.readFileSync(uri.fsPath, 'utf-8');
            const prefixMatch = content.match(/->hasViews\(['"]([^'"]+)['"]\)/);
            if (!prefixMatch) { continue; }

            const prefix = prefixMatch[1];
            // Derive package dir name from path: vendor/solaris/<packageDir>/src/...
            const relative = path.relative(solarisRoot, uri.fsPath);
            const packageDir = relative.split(path.sep)[0];

            map.set(packageDir, prefix);
        } catch {
            // skip unreadable files
        }
    }

    return map;
}
