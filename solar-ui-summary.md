# Solar UI — VS Code Extension
**Project Summary & Technical Requirements**

---

## Overview

Solar UI is an internal VS Code extension that provides Blade component intellisense exclusively for the Solaris package ecosystem. It enables developers to autocomplete component tags, inspect props, and view slot information directly in the editor — with zero manual configuration required.

---

## Goals

- Autocomplete `<x-prefix::component>` tags while typing in `.blade.php` files
- Display component documentation on hover (props, slots, description)
- Auto-detect all installed Solaris packages and their prefixes
- Zero setup — works immediately after installing the extension
- No conflict with the official Laravel VS Code extension

---

## Scope

The extension is scoped **exclusively** to the Solaris ecosystem. It does not index project-level components or third-party vendor packages.

| In Scope | Out of Scope |
|---|---|
| `vendor/solaris/*` component files | `resources/views/components` (project-level) |
| Autocomplete for `<x-prefix::component>` | General Blade syntax features |
| Hover: props, slots, description | PHP class component parsing |
| Auto-detect via Spatie ServiceProvider | Config/Route/Middleware intellisense |

---

## Solaris Package Mapping

Prefixes are resolved automatically from each package's Spatie ServiceProvider (`hasViews` directive).

| Package (`vendor/solaris/...`) | Blade Prefix | Example Usage |
|---|---|---|
| `solaris-laravel-core` | `core` | `<x-core::button />` |
| `solaris-laravel-masterdata` | `master-data` | `<x-master-data::table />` |
| `solaris-laravel-basecrm` | `basecrm` | `<x-basecrm::card />` |
| `solaris-laravel-sales` | `sales` | `<x-sales::form />` |
| `solaris-laravel-marketing` | `marketing` | `<x-marketing::banner />` |

---

## Features

### 1. Autocomplete
- Trigger: typing `<x-` or `@component` in any `.blade.php` file
- Shows all available Solaris components across all installed packages
- Filters in real-time as user types the prefix and component name
- Inserts full tag with required props scaffolded as placeholders

### 2. Hover Documentation
- Trigger: hovering over any `<x-prefix::component>` tag
- Displays: component name, package origin, description, props table, named slots
- Props table includes: name, type, default value, description
- Description and prop docs sourced from `.docs.json` sidecar files (see Documentation Strategy)

### 3. Auto-detection
- On workspace open, checks `composer.json` to confirm Laravel project
- Scans `vendor/solaris/` for installed packages
- Reads each package's ServiceProvider to extract blade prefix via `hasViews()` pattern
- Indexes all `.blade.php` files under `resources/views/components/` per package
- Watches for file changes and re-indexes automatically

---

## Documentation Strategy

Since `@props` directives currently contain no description metadata, a **sidecar JSON file** approach is used. This allows an AI agent (Claude Code) to generate and maintain docs separately from the component source.

### Sidecar File Convention

Each component has an optional companion `.docs.json` file:

```
resources/views/components/button.blade.php
resources/views/components/button.docs.json   ← sidecar
```

### Sidecar Format

```json
{
  "description": "A versatile button component.",
  "props": {
    "variant": { "type": "string", "default": "primary", "description": "Visual style variant" },
    "size":    { "type": "string", "default": "md",      "description": "Button size (sm, md, lg)" },
    "disabled":{ "type": "boolean","default": "false",   "description": "Disables the button" }
  },
  "slots": {
    "default": "Button label content",
    "icon":    "Optional icon placed before the label"
  }
}
```

### Fallback Behavior

| Condition | Behavior |
|---|---|
| `.docs.json` exists | Use sidecar for all docs |
| No sidecar | Parse `@props([...])` from blade, show prop names + defaults only |
| Neither | Show component name only, no prop info |

---

## Technical Architecture

| Module | Responsibility |
|---|---|
| `extension.ts` | Entry point — registers all providers and watchers |
| `scanner/vendorScanner.ts` | Glob `vendor/solaris/*/resources/views/components/**/*.blade.php` |
| `scanner/serviceProviderParser.ts` | Extract blade prefix from Spatie ServiceProvider `hasViews()` |
| `parser/bladeParser.ts` | Parse `@props([...])` and detect `{{ $slot }}` / named slots |
| `parser/docsParser.ts` | Read `.docs.json` sidecar files per component |
| `providers/completionProvider.ts` | VS Code `CompletionItemProvider` — triggers on `<x-` and `@component` |
| `providers/hoverProvider.ts` | VS Code `HoverProvider` — renders markdown docs on hover |
| `types.ts` | `ComponentMeta` interface shared across all modules |

---

## Project File Structure

```
solar-ui/
├── src/
│   ├── extension.ts
│   ├── types.ts
│   ├── scanner/
│   │   ├── vendorScanner.ts
│   │   └── serviceProviderParser.ts
│   ├── parser/
│   │   ├── bladeParser.ts
│   │   └── docsParser.ts
│   └── providers/
│       ├── completionProvider.ts
│       └── hoverProvider.ts
├── package.json          ← extension manifest
├── tsconfig.json
└── .vscode/
    └── launch.json       ← F5 debug config
```

---

## Development Requirements

| Tool | Version | Purpose |
|---|---|---|
| Node.js | >= 18 | Runtime |
| TypeScript | latest | Language |
| `@vscode/vsce` | latest | Build & publish extension |
| `yo` + `generator-code` | latest | Scaffold boilerplate (one-time) |
| `esbuild` | latest | Bundler |
| `@types/vscode` | latest | VS Code API type definitions |
| `@types/node` | latest | Node.js type definitions |

---

## Setup Steps

### Step 1 — Install global tools
```bash
npm install -g @vscode/vsce yo generator-code
```

### Step 2 — Scaffold project
```bash
yo code
```
Pilihan saat prompt:
- Type: `New Extension (TypeScript)`
- Name: `Solar UI`
- Identifier: `solar-ui`
- Bundle: `esbuild`

### Step 3 — Develop & debug
1. Buka folder `solar-ui/` di VS Code
2. Tekan `F5` → Extension Development Host terbuka
3. Buka Laravel project di window baru
4. Test autocomplete dan hover langsung

### Step 4 — Package untuk distribusi internal
```bash
vsce package
# Output: solar-ui-1.0.0.vsix

code --install-extension solar-ui-1.0.0.vsix
```

### Step 5 — Publish ke marketplace (opsional, future)
```bash
vsce login <publisher-name>
vsce publish
```

---

## Conflict Analysis

Solar UI beroperasi pada domain eksklusif yang tidak disentuh extension lain.

| Extension | Overlap Risk | Notes |
|---|---|---|
| `laravel.vscode-laravel` (official) | ✅ None | Blade component autocomplete belum diimplementasi di official extension |
| Laravel Blade Snippets | ✅ None | Hanya general Blade syntax snippets, bukan component intellisense |
| PHP Intelephense | ✅ None | PHP class intelligence only, tidak menyentuh Blade component tags |

---

## Context untuk Sesi Claude Code

Paste context ini saat memulai sesi Claude Code:

```
Saya sedang membuat VS Code extension bernama "Solar UI".

Extension ini menyediakan Blade component intellisense khusus untuk ekosistem
Solaris (package internal Laravel).

Fitur utama:
- Autocomplete <x-prefix::component> saat mengetik di .blade.php
- Hover documentation (props, slots, description)
- Auto-detect package dan prefix dari Spatie ServiceProvider (hasViews pattern)
- Zero config, langsung jalan

Package mapping (confirmed):
- solaris-laravel-core       → prefix: core
- solaris-laravel-masterdata → prefix: master-data
- solaris-laravel-basecrm    → prefix: basecrm
- solaris-laravel-sales      → prefix: sales
- solaris-laravel-marketing  → prefix: marketing

Component type: Anonymous component (blade only, pakai @props directive)

Dokumentasi menggunakan sidecar .docs.json per component.
Fallback: parse @props langsung dari blade file.

Distribusi: internal .vsix, bukan marketplace.
Target user: tim internal Solaris.
```
