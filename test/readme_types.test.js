// Type-checks the JavaScript and TypeScript samples in README.md against the
// published type definitions in dist/, so the docs and the types cannot
// drift apart. Requires `pnpm run build:ts`, like the rest of the suite.
//
// The samples are compiled the way a consumer's project would see them: the
// package is installed under node_modules/libxmljs4 with its package.json and
// declaration files, so `require` and `import` resolve through the `exports`
// map. JavaScript samples are checked with `checkJs` and TypeScript's
// non-strict defaults, which is what a `// @ts-check` comment gives a plain
// JavaScript project. TypeScript samples are checked with `strict`, both as
// CommonJS (.ts) and as ESM (.mts).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');

// Names the samples use without declaring them, as if carried over from an
// earlier sample.
const GLOBALS = `
declare const libxmljs: typeof import('libxmljs4');
declare const xml: string;
declare const doc: import('libxmljs4').Document;
declare const xmlDoc: import('libxmljs4').Document;
declare const xsdString: string;
declare const schematronString: string;
`;

const COMMON_OPTIONS = {
  noEmit: true,
  module: 'nodenext',
  moduleResolution: 'nodenext',
  // Every sample is its own module, so samples can redeclare the names
  // above.
  moduleDetection: 'force',
  target: 'es2022',
  types: ['node'],
  typeRoots: [path.join(root, 'node_modules', '@types')],
  // Check the package's own declaration files too.
  skipLibCheck: false,
};

function extractSamples(markdown) {
  const samples = { js: [], ts: [] };
  const fence = /^```(\w*)\n([\s\S]*?)^```\s*$/gm;
  let match;
  while ((match = fence.exec(markdown)) !== null) {
    const lang = match[1];
    const line = markdown.slice(0, match.index).split('\n').length;
    const sample = { line, code: match[2] };
    if (lang === 'javascript' || lang === 'js') {
      samples.js.push(sample);
    } else if (lang === 'typescript' || lang === 'ts') {
      samples.ts.push(sample);
    }
  }
  return samples;
}

// Install the package's manifest and declaration files as a dependency.
function installPackage(dir) {
  const pkgDir = path.join(dir, 'node_modules', 'libxmljs4');
  fs.mkdirSync(path.join(pkgDir, 'dist'), { recursive: true });
  fs.copyFileSync(
    path.join(root, 'package.json'),
    path.join(pkgDir, 'package.json')
  );
  const declarations = fs
    .readdirSync(path.join(root, 'dist'))
    .filter((file) => /\.d\.m?ts$/.test(file));
  for (const file of declarations) {
    fs.copyFileSync(
      path.join(root, 'dist', file),
      path.join(pkgDir, 'dist', file)
    );
  }
  return declarations;
}

function writeProject(dir, name, compilerOptions, files) {
  const config = path.join(dir, `tsconfig.${name}.json`);
  fs.writeFileSync(
    config,
    JSON.stringify(
      { compilerOptions: { ...COMMON_OPTIONS, ...compilerOptions }, files },
      null,
      2
    )
  );
  return config;
}

function typeCheck(config) {
  const tsc = path.join(
    path.dirname(require.resolve('typescript/package.json')),
    'bin',
    'tsc'
  );
  const result = spawnSync(process.execPath, [tsc, '-p', config], {
    cwd: path.dirname(config),
    encoding: 'utf8',
  });
  if (result.error) {
    throw result.error;
  }
  return { status: result.status, output: result.stdout + result.stderr };
}

describe('README code samples', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const samples = extractSamples(readme);
  let dir;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'libxmljs4-readme-'));
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ type: 'commonjs' })
    );
    fs.writeFileSync(path.join(dir, 'globals.d.ts'), GLOBALS);
    const declarations = installPackage(dir);
    expect(declarations).toContain('index.d.ts');
    expect(declarations).toContain('index.d.mts');
  });

  afterAll(() => {
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('finds the samples', () => {
    expect(samples.js.length).toBeGreaterThan(5);
    expect(samples.ts.length).toBeGreaterThan(0);
  });

  it('type-checks the JavaScript samples', () => {
    const files = ['globals.d.ts'];
    for (const { line, code } of samples.js) {
      const file = `readme-line-${line}.js`;
      fs.writeFileSync(path.join(dir, file), code);
      files.push(file);
    }
    const config = writeProject(
      dir,
      'js',
      { allowJs: true, checkJs: true, strict: false },
      files
    );
    const { status, output } = typeCheck(config);
    expect(output).toBe('');
    expect(status).toBe(0);
  }, 60000);

  it('type-checks the TypeScript samples as CommonJS and ESM', () => {
    const files = ['globals.d.ts'];
    for (const { line, code } of samples.ts) {
      for (const ext of ['ts', 'mts']) {
        const file = `readme-line-${line}.${ext}`;
        fs.writeFileSync(path.join(dir, file), code);
        files.push(file);
      }
    }
    const config = writeProject(dir, 'ts', { strict: true }, files);
    const { status, output } = typeCheck(config);
    expect(output).toBe('');
    expect(status).toBe(0);
  }, 60000);
});
