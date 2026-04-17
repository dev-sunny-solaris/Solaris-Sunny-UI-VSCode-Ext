import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ComponentMeta } from '../types';
import { parseBladeFile } from '../parser/bladeParser';
import { mergeDocsIntoMeta } from '../parser/docsParser';
import { extractPrefixMap } from './serviceProviderParser';

export async function scanComponents(workspaceRoot: string): Promise<ComponentMeta[]> {
    const solarisRoot = path.join(workspaceRoot, 'vendor', 'solaris');

    if (!fs.existsSync(solarisRoot)) {
        return [];
    }

    const prefixMap = await extractPrefixMap(workspaceRoot);

    const pattern = new vscode.RelativePattern(
        vscode.Uri.file(solarisRoot),
        '*/resources/views/components/**/*.blade.php'
    );

    const uris = await vscode.workspace.findFiles(pattern);
    const components: ComponentMeta[] = [];

    for (const uri of uris) {
        const filePath = uri.fsPath;
        const relative = path.relative(solarisRoot, filePath);
        // relative = "solaris-laravel-core/resources/views/components/button.blade.php"
        const parts = relative.split(path.sep);
        const packageDir = parts[0];
        const prefix = prefixMap.get(packageDir);

        if (!prefix) { continue; }

        // Derive component name from path after "components/"
        const componentsMarker = ['resources', 'views', 'components'];
        const markerIdx = parts.findIndex((_, i) =>
            parts[i] === 'resources' && parts[i + 1] === 'views' && parts[i + 2] === 'components'
        );

        if (markerIdx < 0) { continue; }

        const nameParts = parts.slice(markerIdx + componentsMarker.length);
        const lastName = nameParts[nameParts.length - 1].replace(/\.blade\.php$/, '');
        nameParts[nameParts.length - 1] = lastName;
        const name = nameParts.join('.');

        const { props, slots } = parseBladeFile(filePath);

        let meta: ComponentMeta = {
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

        meta = mergeDocsIntoMeta(meta);
        components.push(meta);
    }

    return components;
}
