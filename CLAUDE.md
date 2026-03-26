# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

libxmljs4 is a Node.js native addon providing LibXML2 bindings for JavaScript. Published as `libxmljs4` on npm. Forked from [libxmljs2](https://github.com/marudor/libxmljs2). It wraps the C library libxml2 (vendored in `vendor/libxml/`) via C++ using node-addon-api (N-API), with a TypeScript wrapper layer on top.

## Build & Test Commands

```bash
# Build the native addon (produces build/Release/xmljs.node)
pnpm run build          # or: node-gyp rebuild
make all                # alternative: clean + configure + build

# Compile TypeScript (CJS + ESM) to dist/
pnpm run build:ts

# Run all tests (--expose_gc is required for GC tests)
pnpm test               # runs: node --expose_gc ./node_modules/jest/bin/jest.js

# Run a single test file
node --expose_gc ./node_modules/jest/bin/jest.js test/element.test.js

# Run tests matching a pattern
node --expose_gc ./node_modules/jest/bin/jest.js -t "pattern"

# Type-check the .d.ts definitions
pnpm tsd

# Lint
pnpm lint

# Build prebuilt binaries (for CI)
pnpm prebuild
```

You must rebuild the native addon (`pnpm run build`) after any changes to C++ files in `src/` or vendor code. You must recompile TypeScript (`pnpm run build:ts`) after any changes to `lib/*.ts`.

## Architecture

```
lib/                     → TypeScript source (compiled to dist/)
  index.ts               → Main entry point, exports public API
  index.mts              → ESM wrapper (uses createRequire for native addon)
  bindings.ts            → Loads native addon via node-gyp-build
  document.ts            → Document class (augments native prototype)
  element.ts             → Element class (augments native prototype)
  sax_parser.ts          → SaxParser / SaxPushParser wrappers
  sax_transform.ts       → SaxTransform (Transform stream wrapper)
  types.ts               → Shared TypeScript interfaces
dist/                    → Compiled output (gitignored)
  index.js / index.d.ts  → CJS entry
  index.mjs / index.d.mts → ESM entry
src/                     → C++ native bindings using node-addon-api (N-API)
  libxmljs.cc            → Module init, memory tracking (napi_adjust_external_memory)
  xml_node.cc/.h         → Base node class (plain C++, NOT ObjectWrap)
  xml_document.cc/.h     → Document (Napi::ObjectWrap<XmlDocument>)
  xml_element.cc/.h      → Element (Napi::ObjectWrap<XmlElement> + XmlNode)
  xml_sax_parser.cc/.h   → SAX parsing (two ObjectWrap classes + shared base)
  xml_textwriter.cc/.h   → XML serialization
  xml_xpath_context.cc   → XPath queries
  (+ attribute, comment, text, pi, namespace)
vendor/libxml/           → Embedded libxml2 C source
index.js                 → Thin CJS re-export of dist/index.js (for test compat)
```

### C++ Class Hierarchy (node-addon-api)

`XmlNode` is a plain C++ base class (NOT ObjectWrap) with pure virtual methods `Value_()`, `Ref_()`, `Unref_()`. Each concrete type uses multiple inheritance:
```
XmlElement : public Napi::ObjectWrap<XmlElement>, public XmlNode
XmlText    : public Napi::ObjectWrap<XmlText>,    public XmlNode
...
```
This avoids the CRTP collision that prevents `Napi::ObjectWrap<Base>` → `Napi::ObjectWrap<Derived>` inheritance.

### Memory Management

`src/libxmljs.cc` replaces libxml2's memory allocator with custom wrappers that call `napi_adjust_external_memory()`, letting V8's GC account for native memory usage. A global `napi_env` is stored during module init and cleared via cleanup hook. Tests verify this with `--expose_gc` and explicit GC cycling in `test/setup.js`.

## Native Build System

- `binding.gyp` defines the GYP build: compiles all `src/*.cc` and `vendor/libxml/*.c` into `xmljs.node`
- Uses `node-addon-api` for ABI-stable binaries (one build works across Node versions)
- Prebuilt binaries distributed via `prebuildify` / `node-gyp-build`
- CI builds prebuilts for Windows, macOS, Ubuntu, and Alpine

## Dual CJS/ESM Package

- CJS: `dist/index.js` (compiled from `lib/index.ts`)
- ESM: `dist/index.mjs` (compiled from `lib/index.mts`, uses `createRequire` for native addon)
- Configured via `exports` field in package.json

## Fork Maintenance

When making any change that diverges from the upstream libxmljs2 behavior (API changes, removed features, new defaults, breaking changes), update the "Changes from libxmljs2" section in `README.md`. This helps users migrating from libxmljs2 understand what differs. Even seemingly minor changes should be documented if they could affect existing code.

## Code Style

- Prettier: single quotes, 2-space indent, 80 char width, ES5 trailing commas
- ESLint: flat config (`eslint.config.js`), `@eslint/js` recommended + prettier
- EditorConfig: LF line endings, 2-space indentation

## Known Issues

- 2 test suites (ref_integrity, memory_management) crash during Jest worker teardown AFTER all tests pass. This is a GC-during-shutdown edge case in the N-API cleanup hooks — all actual test assertions pass.
