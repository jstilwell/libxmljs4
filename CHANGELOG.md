# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-10-11

### Added

- **TypeScript types for the whole public API**, identical for `require` and
  `import`: instance types for `Document`, `Element`, `Node`, `Attribute`,
  `Text`, `Comment`, `ProcessingInstruction`, `Namespace`, the SAX parsers,
  `SaxTransform` and `TextWriter`. Before, the parse functions were typed as
  returning the `Document` constructor, and every ESM export was `any`.
  `index.test-d.ts` now asserts the types, and the README code samples are
  type-checked in the test suite. **Stricter types can surface new errors in
  TypeScript projects**: for example, `parseXml(x).root()` is
  `Element | null`, and `find()` can return `null`.
- **`maxErrors` option** for parsing, and as an optional second argument to
  `validate()`, `rngValidate()` and `schematronValidate()`. It sets how many
  entries `doc.errors` or `doc.validationErrors` collect. The default is
  `10000`; pass `Infinity` for no limit.
- **Optional npm publishing from CI**, with provenance through npm trusted
  publishing. It is off until the repository variable
  `NPM_TRUSTED_PUBLISHING` is `true`.

### Changed

- **`doc.errors` and `doc.validationErrors` hold at most 10,000 entries by
  default.** Every libxml2 diagnostic used to become a JS `Error`, so a small
  malformed input could use hundreds of megabytes.
- **`parseXml` ignores the HTML-only `doctype` and `implied` options.** They
  share flag bits with XML options, so `parseXml(xml, { doctype: false })`
  loaded the external DTD and `implied: false` acted as `nsclean`.
- **`SaxTransform` fails the stream when a listener throws during the final
  push**, as it already did for earlier chunks. Before, the exception was
  swallowed.
- **The documented `old` parser option now works**, as an alias for `old10`.
  It was silently ignored.

### Fixed

- `parseXml` and `parseHtml` read a `DataView` source as bytes instead of
  aborting the process, and accept any typed array.
- `new SaxParser() instanceof SaxParser` (and the same for `SaxPushParser`)
  is `true`.

### Internal

- Dev dependencies were refreshed within their existing ranges, taking
  `pnpm audit` from 36 advisories to 1. The one left is `braces`, reached
  only through `tsd`, and has no patched release. `node-addon-api` resolves
  to 8.9.2.
- `bin/deploy.sh` no longer publishes. `bin/deploy.sh publish` downloads the
  release's prebuild tarball and publishes only if every platform is
  present.

## [2.0.1] - 2026-10-11

### Security

- **CVE-2024-34393 and CVE-2024-34394 are actually fixed.** The 2.0.0 notes
  claimed the N-API rewrite fixed them, but DTD, entity, and declaration
  nodes were still treated as elements. Element-only methods now check the
  node type first: `attrs()` and `namespaces(true)` return `[]`, `attr()` and
  `namespace()` return `null`, and methods that modify the node throw.
- **libxml2 updated to 2.9.14 with distribution security backports.** The
  vendored copy was an unpatched June 2021 snapshot (2.9.12 plus 12 commits)
  whose headers said 2.9.9. It is now 2.9.14 plus Debian trixie's and
  Ubuntu's backports, closing every reachable CVE found in the audit,
  including CVE-2024-56171, CVE-2026-6653, CVE-2025-49794, CVE-2025-49796,
  CVE-2022-40304, CVE-2026-86140, CVE-2025-24928, CVE-2022-23308,
  CVE-2025-32415, CVE-2023-28484 and CVE-2023-29469. `vendor/libxml/PATCHES.md`
  lists every patch. HTML parser output for malformed input is deliberately
  kept as it was.
- Fixed process crashes reachable from ordinary input or calls:
  - `find('//namespace::*')`;
  - XPath errors after `validate()` or `rngValidate()` failed on an invalid
    schema, which left the global error handler pointing at freed memory;
  - inserting a text node next to existing text with `addNextSibling()` or
    `addPrevSibling()`;
  - re-entrant SAX parsing;
  - SAX parsing of an empty string.
- Builds use `-fstack-protector-strong` and full RELRO on Linux, and Control
  Flow Guard on Windows.

### Fixed

- Invalid arguments throw a `TypeError` instead of aborting the process, for
  example `parseXml(null)`, `addChild(null)`, or a non-node passed to
  `addNextSibling()`.
- String arguments are converted with `String(value)` again, as in libxmljs2,
  so `attr('n', 5)` and `attr({ n: 5 })` work. In 2.0.0 they aborted the
  process.
- `find()`, `get()`, and `childNodes()` no longer fail intermittently with
  "Invalid argument" under garbage-collection pressure.
- After a worker thread that loaded the addon exits, the main thread keeps
  working. It used to crash on its next parse. Parsing on several threads at
  the same time is still unsupported.
- `attr(name)` returns `null`, instead of aborting, for an attribute that
  only has a DTD default value.
- `SaxTransform` decodes multi-byte UTF-8 characters split across chunks
  correctly.
- `parseHtmlFragment` no longer modifies the options object passed to it.
- `null` options are treated like omitted options in all parse functions.
- `SaxParser` and `SaxPushParser` instances are `instanceof EventEmitter`.
- `examples/cdata.js` runs again.

### Changed

- `libxml_version` reports `2.9.14`.
- Inputs whose entity expansion exceeds both 10 MB and 10 times the input
  size are rejected, even with `huge`. Without `huge`, CDATA sections over
  10,000,000 bytes and quoted literals or NMTOKENs over 50,000 characters are
  rejected.

### Internal

- The memory-management and ref-integrity test suites run by default again,
  and `test/security.test.js` covers each fixed crash.
- CI pins every action to a commit SHA, gives the workflow token read-only
  access by default, tests on Node 26, and loads each prebuild before
  uploading it.
- Removed a stale precompiled header, `vendor/libxml/config.h.gch`, from the
  repository and the npm package.

## [2.0.0] - 2026-07-28

### Breaking

- **`engines.node` narrowed to `^22.22.2 || ^24.15.0 || >=26`** (previously
  `>=22`). This matches the range required by node-gyp 13. Node 22.0 through
  22.22.1 satisfied the old range and no longer do.
- **`node-gyp` moved from `dependencies` to `devDependencies`.** It is only
  used by the build scripts; the runtime addon-loading path goes through
  `node-gyp-build`. Consumers no longer download node-gyp on install. Anyone
  who was relying on libxmljs4 to transitively provide node-gyp now needs to
  depend on it directly.

### Fixed

- **`namespace()` no longer aborts the process when given a non-string href.**
  `el.namespace('bar', null)` terminated the process with
  `FATAL ERROR: Error::New napi_get_last_error_info` instead of throwing.

  `XmlNamespace`'s constructor correctly rejected the missing href, but this
  addon is built with `NAPI_DISABLE_CPP_EXCEPTIONS`, so
  `ThrowAsJavaScriptException()` only schedules a JS exception rather than
  unwinding. `Namespace_Method` then unwrapped the half-constructed object
  with that exception still pending, which is a fatal N-API error.

  The href is now validated up front, and a pending exception is checked for
  after construction. Invalid hrefs throw a `TypeError`. The same abort was
  reachable via `namespace(undefined)`, `namespace(42)`, and `namespace({})`;
  all now throw. The single-argument `namespace(null)` form still removes the
  namespace as documented.

- **Prebuilt binaries now cover every supported platform.** Releases before
  this one published prebuilds for `darwin-arm64` only (and 1.0.0 shipped only
  a stale `libxmljs3.node`, so it had no loadable prebuild at all under the
  current package name). Everyone else silently compiled from source on
  install, which requires python and a C++ toolchain. The release now ships
  prebuilds for macOS arm64, Linux x64/arm64 (glibc), Linux x64 (musl), and
  Windows x64/arm64.
- **Alpine/musl prebuilds are tagged correctly.** `prebuildify` now runs with
  `--tag-libc`. Without it, the musl and glibc Linux x64 builds were both
  named `linux-x64/libxmljs4.node`, so only one survived packaging and a musl
  user could receive a glibc binary that fails to load.

### Changed

- Upgraded to **TypeScript 7**. Both tsconfigs now set `"types": ["node"]`,
  which TypeScript 6 and 7 require since the `types` default became `[]`. The
  emitted `.d.ts` files are byte-identical to the TypeScript 5.9 output.
- Upgraded to **ESLint 10**. `no-useless-assignment` (new in
  `eslint:recommended`) is disabled for `test/**`, where variables are
  deliberately reassigned to drop references so the GC can collect the
  underlying native objects.
- Upgraded to **Vitest 4**. `test.poolOptions` was removed upstream, so
  `execArgv: ['--expose_gc']` moved to the top level of the `test` config.
- Upgraded node-gyp (11 → 13), globals (16 → 17), node-addon-api (8.6 → 8.9),
  prettier (3.5 → 3.9), tsd (0.32 → 0.33), and `@types/node` (22.15 → 22.20).

  `@types/node` intentionally stays on 22.x to track the minimum supported
  Node version rather than the latest, because the published `.d.ts` files
  re-export `node:stream` and `node:events` types to consumers.

### Known issues

- `test/memory_management.test.js` and `test/ref_integrity.test.js` remain
  excluded from the default test run. They no longer abort the process, but
  still have unresolved memory-accounting failures.
- The vendored libxml2 is **2.9.9** (January 2019) and carries known
  unpatched CVEs, including CVE-2022-40304, CVE-2021-3517, CVE-2021-3541, and
  CVE-2021-3518. Because it is compiled into the addon rather than resolved as
  a package, `npm audit` does not surface it. Upgrading is non-trivial:
  libxml2 2.12–2.14 moved error handling to thread-local and per-context
  handlers and changed `xmlGetLastError` to return a `const` pointer, which
  the current global-handler usage in `src/xml_document.cc` depends on.
  Treat untrusted XML, XInclude, and Schematron input with caution.

## [1.2.0] - 2026-03-26

### Changed

- Optimized native `toString()`: element and node option parsing now caches
  property lookups instead of repeatedly querying the options object.
- Reduced published package size by disabling source maps and declaration
  maps in the shipped `dist` files.

## [1.1.0] - 2026-03-26

### Changed

- Documentation updates.

## [1.0.0] - 2026-03-25

Initial release of the fork, from
[libxmljs2](https://github.com/marudor/libxmljs2).

### Security

- **Fixed CVE-2024-34393 and CVE-2024-34394** — type confusion vulnerabilities
  in `attrs()` and `namespaces()` that could lead to denial of service, data
  leakage, or remote code execution. The C++ binding layer was rewritten from
  NAN to node-addon-api with type-safe wrapping, removing the class of unsafe
  pointer casts that caused them.

### Breaking

- **Removed compatibility synonyms**: `parseXmlString` (use `parseXml`),
  `parseHtmlString` (use `parseHtml`), `Document.fromXmlString` (use
  `Document.fromXml`), `Document.fromHtmlString` (use `Document.fromHtml`).
- **Renamed package**: published as `libxmljs4`.

### Changed

- **Node-API (N-API)**: the native addon uses ABI-stable Node-API instead of
  NAN, so prebuilt binaries work across Node.js versions without
  recompilation.
- **TypeScript source**: the JS wrapper layer is written in TypeScript with
  generated type definitions.
- **ESM support**: both `require()` and `import` work via the `exports` field.
- **Replaced the `bindings` package**: native addon loading no longer depends
  on it.

[2.1.0]: https://github.com/jstilwell/libxmljs4/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/jstilwell/libxmljs4/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/jstilwell/libxmljs4/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/jstilwell/libxmljs4/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/jstilwell/libxmljs4/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/jstilwell/libxmljs4/releases/tag/v1.0.0
