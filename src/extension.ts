import * as vscode from 'vscode';
import * as path from 'path';
import { ComponentMeta } from './types';
import { scanComponents } from './scanner/vendorScanner';
import { createCompletionProvider } from './providers/completionProvider';
import { createHoverProvider } from './providers/hoverProvider';

let components: ComponentMeta[] = [];

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) { return; }

    await refresh(workspaceRoot);

    const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(
            vscode.Uri.file(path.join(workspaceRoot, 'vendor', 'solaris')),
            '**/*.blade.php'
        )
    );

    const rescan = () => refresh(workspaceRoot);
    watcher.onDidCreate(rescan);
    watcher.onDidChange(rescan);
    watcher.onDidDelete(rescan);

    context.subscriptions.push(
        watcher,
        ...createCompletionProvider(() => components),
        createHoverProvider(() => components)
    );
}

export function deactivate(): void {
    components = [];
}

async function refresh(workspaceRoot: string): Promise<void> {
    try {
        components = await scanComponents(workspaceRoot);
    } catch (err) {
        console.error('[Solar UI] Scan failed:', err);
    }
}

function getWorkspaceRoot(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    return folders && folders.length > 0 ? folders[0].uri.fsPath : undefined;
}
