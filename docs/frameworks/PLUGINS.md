---
title: "Aera Router CLI Plugin System"
version: 3.8.40
lastUpdated: 2026-06-28
---

# Aera Router CLI Plugin System

Extend the `aera-router` CLI without modifying its core. Plugins follow the `aera-router-cmd-*` naming convention, similar to `gh extension` or `kubectl plugin`.

## Quick start

```bash
# Install a plugin from npm
aera-router plugin install stripe

# Install a local plugin in development
aera-router plugin install ./my-plugin

# List installed plugins
aera-router plugin list

# Scaffold a new plugin
aera-router plugin scaffold myplugin
cd aera-router-cmd-myplugin
aera-router plugin install .
```

## Plugin anatomy

A plugin is an npm package named `aera-router-cmd-<name>` (or `@scope/aera-router-cmd-<name>`).

```
aera-router-cmd-myplugin/
├── package.json     # must have "type": "module" and "main": "index.mjs"
├── index.mjs        # exports register(program, ctx) + optional meta
└── README.md
```

### `package.json`

```json
{
  "name": "aera-router-cmd-myplugin",
  "version": "0.1.0",
  "type": "module",
  "main": "index.mjs",
  "engines": { "aera-router": ">=4.0.0" },
  "keywords": ["aera-router-plugin", "aera-router-cmd"]
}
```

### `index.mjs`

```js
export const meta = {
  name: "myplugin",
  version: "0.1.0",
  description: "My plugin for Aera Router",
  aeraRouterApi: ">=4.0.0",
};

export function register(program, ctx) {
  program
    .command("myplugin")
    .description(meta.description)
    .option("-n, --name <name>")
    .action(async (opts, cmd) => {
      const gOpts = cmd.optsWithGlobals();
      const res = await ctx.apiFetch("/api/combos", {
        baseUrl: gOpts.baseUrl,
        apiKey: gOpts.apiKey,
      });
      const data = await res.json();
      ctx.emit(data, gOpts);
    });
}
```

## Plugin context API

The `ctx` object passed to `register(program, ctx)`:

| Property                     | Type             | Description                                        |
| ---------------------------- | ---------------- | -------------------------------------------------- |
| `ctx.apiFetch(path, opts)`   | `async function` | Authenticated fetch to the Aera Router server      |
| `ctx.emit(data, opts)`       | `function`       | Output in table/json/jsonl/csv per `--output` flag |
| `ctx.t(key)`                 | `async function` | i18n translation lookup                            |
| `ctx.withSpinner(label, fn)` | `async function` | Wraps async fn with ora spinner                    |
| `ctx.baseUrl`                | `string`         | Resolved base URL                                  |
| `ctx.apiKey`                 | `string \| null` | API key if provided                                |

## Discovery

Plugins are discovered from:

1. `~/.aera-router/plugins/<name>/` — user-local installs
2. `AERA_ROUTER_PLUGIN_PATH` env var — custom directory

Loading errors are caught and printed as warnings — a broken plugin never crashes the CLI.

## Security

Plugins run with the same Node.js process privileges as `aera-router`. Only install plugins from sources you trust. `aera-router plugin install` shows an explicit warning and requires `--yes` or interactive confirmation.

## Publishing

1. Ensure `package.json` has `"keywords": ["aera-router-plugin"]`
2. `npm publish` as normal
3. Users discover via `aera-router plugin search <query>` (searches npm registry)

## Example plugin

See [`examples/aera-router-cmd-hello/`](../../examples/aera-router-cmd-hello/index.mjs) for a minimal working example with `meta` + `register()`.
