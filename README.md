# Solar UI

Blade component intellisense for the **Solaris** internal Laravel package ecosystem.

## Features

- **Autocomplete** — type `<x-core::` and get a full list of components with required props scaffolded
- **Hover documentation** — hover over any `<x-prefix::component>` tag to see props table (type, default, description) and available slots
- **Prop completion** — press `Ctrl+Space` inside an opening tag to see all available props
- **Zero config** — auto-detects installed Solaris packages from `vendor/solaris/`

## Supported Packages

| Package | Blade Prefix | Example |
|---------|-------------|---------|
| `solaris-laravel-core` | `core` | `<x-core::button />` |
| `solaris-laravel-masterdata` | `master-data` | `<x-master-data::activity.list />` |
| `solaris-laravel-basecrm` | `basecrm` | `<x-basecrm::card />` |
| `solaris-laravel-sales` | `sales` | `<x-sales::opportunity.list />` |
| `solaris-laravel-marketing` | `marketing` | `<x-marketing::stripo-editor />` |

## Usage

**Tag autocomplete** — type `<x-` in any `.blade.php` file:
```blade
<x-core::table ...  ← triggers autocomplete
```

**Prop completion** — inside an opening tag, press `Ctrl+Space`:
```blade
<x-core::table id="users_table" ← Ctrl+Space here shows remaining props
```

**Hover docs** — hover over any component tag to see full documentation.

## Requirements

- A Laravel project with Solaris packages installed under `vendor/solaris/`
- Workspace must contain `composer.json` at root
