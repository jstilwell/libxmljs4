# Vendored libxml2: provenance and patches

This directory holds libxml2 **2.9.14** with distribution security backports
applied on top. The library is compiled straight into the addon (see the
`sources` list in `../../binding.gyp`), so `npm audit` cannot see it. This file
records exactly what the tree contains so it can be audited and rebuilt.

## Upstream base

| | |
|---|---|
| Release | libxml2 2.9.14 (2 May 2022) |
| Tarball | https://download.gnome.org/sources/libxml2/2.9/libxml2-2.9.14.tar.xz |
| SHA-256 | `60d74a257d1ccec0475e749cba2f21559e48139efba6ff28224357c7c798dfee` (matches `libxml2-2.9.14.sha256sum` published next to the tarball) |
| Previous base | upstream commit `22f15211` (2.9.12 plus 12 commits), imported by libxmljs2 commit `ed0122d`. The version macros then still said 2.9.9. |

Every file in this directory that also ships in the tarball was replaced with
its 2.9.14 copy, with these exceptions:

- `config.h` and `include/libxml/xmlversion.h` are written by hand, because
  they encode this build's feature selection (no threads, HTTP, FTP, iconv,
  zlib or lzma, and so on). Only their version macros were changed, to
  2.9.14 / 20914. A diff against the tarball's `config.h.in` and
  `include/libxml/xmlversion.h.in` shows 2.9.14 adds no macro this build
  needs. `HAVE_ATTRIBUTE_DESTRUCTOR` stays undefined, as before.
  `LIBXML_EXPR_ENABLED` stays on; upstream 2.9.14 turns it off by default,
  but nothing in `src/` calls the `xmlExp*` API.
- Files that are not in the tarball were left as they were: `Makefile`,
  `include/libxml/Makefile`, `include/libxml/xmlwin32version.h` and
  `rngparser.c`. None of them is compiled.
- The stale `config.h.gch` precompiled header was deleted, and `*.gch` is
  now in `.gitignore`.

## Applied patches

The patches were applied in the order below with `patch -p1`, after a
`--dry-run` of each. Only hunks for files vendored here were kept. Hunks for
tests, results, `runtest.c`, `runxmlconf.c`, `testrecurse.c`, `testcatalog.c`,
`Makefile.am` and `CMakeLists.txt` were dropped. Every patch applied with no
rejects.

To verify the result: apply the full Debian series to a pristine 2.9.14 tree.
Every vendored file then matches byte for byte, except for the differences
listed under "Skipped patches" and the hand-maintained `xmlversion.h`.

### 1. Debian trixie security series

- Source: Debian `libxml2` packaging for trixie, version
  `2.12.7+dfsg+really2.9.14-2.1+deb13u4`.
- Repository: https://salsa.debian.org/xml-sgml-team/libxml2, branch
  `trixie`, commit `1c46af286fd96b969b9809d86377bdd73ad901b2`.
- Each patch is at
  `https://salsa.debian.org/xml-sgml-team/libxml2/-/blob/1c46af286fd96b969b9809d86377bdd73ad901b2/debian/patches/<name>`.

| # | Debian patch | Upstream origin | CVE / issue | Files touched here |
|---|---|---|---|---|
| 1 | `CVE-2022-40303-Fix-integer-overflows-with-XML_PARSE_.patch` | c8469863 | CVE-2022-40303 | parser.c |
| 2 | `CVE-2022-40304-Fix-dict-corruption-caused-by-entity-.patch` | 1b41ec4e | CVE-2022-40304 | entities.c |
| 3 | `schemas-Fix-null-pointer-deref-in-xmlSchemaCheckCOSS.patch` | 4c6922f7 | OSS-Fuzz 51295 | xmlschemas.c |
| 4 | `CVE-2023-28484-Fix-null-deref-in-xmlSchemaFixupCompl.patch` | 647e072e | CVE-2023-28484 | xmlschemas.c |
| 5 | `CVE-2023-29469-Hashing-of-empty-dict-strings-isn-t-d.patch` | 09a2dd45 | CVE-2023-29469 | dict.c |
| 6 | `Reset-nsNr-in-xmlCtxtReset.patch` | 5930fe01 | CVE-2022-2309 (lxml) | parser.c |
| 7 | `Also-reset-nsNr-in-htmlCtxtReset.patch` | a82ea25f | CVE-2022-2309 (lxml) | HTMLparser.c |
| 8 | `CVE-2022-49043.patch` | 5a19e216 | CVE-2022-49043 | xinclude.c |
| 9 | `CVE-2024-56171.patch` | 5880a9a6 | CVE-2024-56171 | xmlschemas.c |
| 10 | `CVE-2025-24928-pre1.patch` | 577e2516 | CVE-2025-24928 (prerequisite) | valid.c |
| 11 | `CVE-2025-24928.patch` | 8c8753ad | CVE-2025-24928 | valid.c |
| 12 | `CVE-2025-27113.patch` | 6c716d49 | CVE-2025-27113 | pattern.c |
| 13 | `CVE-2023-39615_1.patch` | d0c3f01e | CVE-2023-39615 | parser.c |
| 14 | `CVE-2023-39615_2.patch` | 235b15a5 | CVE-2023-39615 | SAX2.c, parser.c |
| 15 | `CVE-2023-45322.patch` | 30d7660b | CVE-2023-45322 | tree.c |
| 16 | `CVE-2024-25062.patch` | 2b0aac14 | CVE-2024-25062 | xmlreader.c |
| 17 | `CVE-2025-32415.patch` | 384cc7c1 | CVE-2025-32415 | xmlschemas.c |
| 18 | `CVE-2025-6021.patch` | acbbeef9 | CVE-2025-6021 | tree.c |
| 19 | `CVE-2025-49794_49796.patch` | f7ebc65f | CVE-2025-49794, CVE-2025-49796 | schematron.c |
| 20 | `CVE-2025-6170.patch` | 5e9ec5c1 | CVE-2025-6170 | debugXML.c (not compiled) |
| 21 | `CVE-2025-7425.patch` | Apple fix for libxslt#140 | CVE-2025-7425 | HTMLparser.c, SAX2.c, include/libxml/tree.h, parser.c, tree.c, valid.c, xmlreader.c, xmlschemas.c, xmlschemastypes.c |
| 22 | `CVE-2025-9714.patch` | 677a4264 | CVE-2025-9714 | xpath.c |
| 23 | `CVE-2026-1757.patch` | 5446460a | CVE-2026-1757 | debugXML.c (not compiled) |
| 24 | `0030-Fix-memory-leak-of-prefix-in-xmlTextWriterStartEleme.patch` | 7d138310 | memory leak | xmlwriter.c |
| 25 | `CVE-2025-8732.patch` | 3425dece | CVE-2025-8732 | catalog.c |
| 26 | `CVE-2026-0990.patch` | ac6f0fde | CVE-2026-0990 | catalog.c |
| 27 | `CVE-2026-0992/01-4af23b523.patch` | 4af23b52 | CVE-2026-0992 | catalog.c |
| 28 | `CVE-2026-0992/02-096402c94.patch` | 096402c9 | CVE-2026-0992 | catalog.c |
| 29 | `CVE-2026-0989.patch` | 66c52b3a | CVE-2026-0989 | relaxng.c, include/libxml/relaxng.h |
| 30 | `0037-use-duplicating-variant-in-relaxng-to-mitigate-UAF.patch` | df2ba65f | use-after-free | relaxng.c |
| 31 | `0038-fix-memory-leak-in-issue-1054.patch` | 8d77ac83 | memory leak (#1054) | xmlwriter.c |
| 32 | `0039-schematron-fix-additional-memory-leaks-on-error-path.patch` | 99bf8af1 | memory leaks | schematron.c |
| 33 | `0040-catalog-fix-stack-overflow-from-self-referencing-SGM.patch` | 4982ee83 | stack overflow (#1064) | catalog.c |
| 34 | `CVE-2026-6653.patch` | backport of 463bbeec (+ f34f184f), via Ubuntu | CVE-2026-6653 | SAX2.c, entities.c, include/libxml/entities.h, include/libxml/parser.h, parser.c, parserInternals.c |

Upstream commit hashes are abbreviated. The full hashes are in each patch
header and at https://gitlab.gnome.org/GNOME/libxml2/-/commit/<hash>.

### 2. Fixes from upstream 2.15.4 that Debian trixie does not have yet

- Ubuntu noble's 2.9.14 backports, from `libxml2 2.9.14+dfsg-1.3ubuntu3.10`
  (USN-8910-1).
  - Source: https://launchpad.net/ubuntu/+archive/primary/+sourcefiles/libxml2/2.9.14+dfsg-1.3ubuntu3.10/libxml2_2.9.14+dfsg-1.3ubuntu3.10.debian.tar.xz
  - Each patch is in `debian/patches/` inside that tarball.
- One upstream commit, applied directly.

| # | Patch | Upstream origin | CVE | Files touched here |
|---|---|---|---|---|
| 35 | Ubuntu `CVE-2026-86140.patch` | d1686f91 | CVE-2026-86140 | valid.c |
| 36 | upstream commit c6324894 (`catalog.c` hunk only): https://gitlab.gnome.org/GNOME/libxml2/-/commit/c63248941708bc1d2e3a4292954593312212f6ca | c6324894 (a34c084d on the 2.15 branch) | CVE-2026-76781, a NULL dereference introduced by the CVE-2026-0992 fix above | catalog.c |
| 37 | Ubuntu `CVE-2026-86138.patch` | a4cba4b5 | CVE-2026-86138 | dict.c |
| 38 | Ubuntu `CVE-2026-86142.patch` | 6b3a736c | CVE-2026-86142 | xpointer.c |
| 39 | Ubuntu `CVE-2026-86143.patch` | 90f293ba | CVE-2026-86143 | xmlIO.c |
| 40 | Ubuntu `CVE-2026-86144.patch` | b63cd517 | CVE-2026-86144 | xinclude.c |

For #36, Ubuntu's own `CVE-2026-76781.patch` targets a `catalog.c` that lacks
the CVE-2026-0992 follow-up (#28), so its context does not match this tree.
The upstream one-line hunk was used instead.

## Skipped patches

| Patch (Debian trixie unless noted) | Reason |
|---|---|
| `install-html.patch` | Debian packaging (doc/Makefile.am) |
| `xml2-config-fix.patch` | Debian packaging (xml2-config.in) |
| `python3-unicode-errors.patch`, `python3.13.patch` | Python bindings, not vendored |
| `CVE-2025-32414-bug-889-v2.10.4-and-below.patch` | Python bindings only (python/libxml.c) |
| Ubuntu `CVE-2026-74860.patch` | Python bindings only |
| `CVE-2024-34459.patch` | xmllint only (`xmllint.c` is vendored, but it is a CLI tool and is not compiled) |
| `0035-testcatalog-Add-new-tests-for-catalog.c.patch` | Test infrastructure. It adds a test-only public API, `xmlCatalogDumpDoc`, and refactors `xmlDumpXMLCatalog` to support `testcatalog.c`. No security change. |
| Test, result and build hunks of mixed patches | Not vendored |

These CVEs are known but do not affect this tree, so there is nothing to apply:

- **CVE-2026-86139** (`xmlURIEscapeStr`): the vulnerable code arrived in
  2.13.0. Debian marks 2.9.14 as not affected.
- **CVE-2026-86137** (xmlregexp `NXT` out-of-bounds read): the vulnerable
  code arrived in 2.15.3.
- **CVE-2026-86141** (`xmlRegNewParserCtxt` NULL dereference): the bug was
  introduced by the CVE-2026-86137 fix. In this tree, `xmlRegNewParserCtxt`
  does not compute a string length.

## Behaviour notes

These changes come from the base update and the patches. Users can observe
them:

- **HTML parser (2.9.13/2.9.14 upstream).** A `<` that is not followed by an
  ASCII letter is now kept as literal text. Previously, outside recover mode,
  everything up to the next `>` was silently dropped. Tags such as `<_x>`,
  `<:b>` and `<.y>` are now text rather than elements. `<![CDATA[...]]>` and
  `<!ELEMENT ...>` in HTML input are kept as text. The `htmlParseStartTag:
  invalid element name` error is no longer reported. A single-quoted
  `PUBLIC` identifier in an HTML DOCTYPE now parses correctly.
- **Entity amplification (CVE-2026-6653 backport, upstream 2.11 design).**
  Entity expansion is now measured by expanded size. Parsing fails with
  "Maximum entity amplification factor exceeded" when the total exceeds
  10 MB and also exceeds 10 times the input consumed so far. The check now
  applies with or without `noent`, and also with `huge`. Previously, `huge`
  turned it off.
- **Size limits (CVE-2022-40303).** The limits are now strict.
  - A CDATA section over 10,000,000 bytes fails without `huge`. It used to
    pass up to about 13.1 MB.
  - A SYSTEM literal, PUBLIC literal or NMTOKEN over 50,000 characters fails
    without `huge`. These used to pass up to about 51,200.
  - With `huge`, names are capped at 10 MB and text at 1 GB.
  - The "Name too long" error message lost its "use XML_PARSE_HUGE option"
    suffix.
- **RelaxNG (CVE-2026-0989).** `include` nesting is limited to 1000 levels.
  The `RNG_INCLUDE_LIMIT` environment variable overrides the limit, and a
  non-numeric value makes RelaxNG schema parsing fail.
- **Schematron (CVE-2025-49796).** `<name path="..."/>` now prints only
  element and attribute names. Other node types print nothing.
- **XML Schema (2.9.13).** A schema that uses `xmlns=""` with unprefixed
  type references is accepted. The "more than one top element" check is
  gone.
