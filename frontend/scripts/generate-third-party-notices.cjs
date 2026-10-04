/* License files are copied verbatim. Run after changing the npm lockfile. */
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const frontendRoot = path.resolve(__dirname, '..');
const outputPath = path.join(frontendRoot, 'src/assets/third-party-notices.json');
const fallbackRoot = path.join(__dirname, 'license-fallbacks');
const fallbackSources = JSON.parse(fs.readFileSync(path.join(fallbackRoot, 'sources.json'), 'utf8'));
const licenseName = /^(licen[cs]e|copying|notice)([._-].*)?$/i;
const collate = (a, b) => a < b ? -1 : a > b ? 1 : 0;

function collectFiles(packageRoot, installed) {
  const files = [];
  for (const item of fs.readdirSync(packageRoot, { withFileTypes: true })) {
    if (item.isFile() && licenseName.test(item.name)) files.push(item.name);
    if (item.isDirectory() && /^(licenses?|notices?)$/i.test(item.name)) {
      const visit = (relative) => {
        for (const child of fs.readdirSync(path.join(packageRoot, relative), { withFileTypes: true })) {
          const childPath = path.join(relative, child.name);
          if (child.isDirectory()) visit(childPath);
          else if (child.isFile()) files.push(childPath);
        }
      };
      visit(item.name);
    }
  }
  if (files.length === 0) {
    const fallback = fallbackSources.find((source) => source.name === installed.name);
    if (fallback) {
      if (fallback.version !== installed.version) {
        throw new Error(`Reverify the upstream license fallback for ${installed.name}@${installed.version}.`);
      }
      // Normalize checkout line endings; the verified upstream bytes use LF.
      const text = fs.readFileSync(path.join(fallbackRoot, fallback.file), 'utf8').replace(/\r\n/g, '\n');
      if (createHash('sha256').update(text).digest('hex') !== fallback.sha256) {
        throw new Error(`Upstream license fallback hash differs: ${fallback.file}`);
      }
      return [{
        file: `LICENSE (verified upstream ${fallback.version})`, text,
        source: { url: fallback.url, tag: fallback.tag, commit: fallback.gitHead },
      }];
    }
  }
  return files.sort(collate).map((file) => ({
    file: file.split(path.sep).join('/'),
    text: fs.readFileSync(path.join(packageRoot, file), 'utf8'),
  }));
}

function generateNotices() {
  const manifest = JSON.parse(fs.readFileSync(path.join(frontendRoot, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(frontendRoot, 'package-lock.json'), 'utf8'));
  const packages = Object.entries(lock.packages)
    .filter(([location, entry]) => location && !entry.dev)
    .map(([location, entry]) => {
      const packageRoot = path.join(frontendRoot, location);
      const installed = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
      if (installed.version !== entry.version) {
        throw new Error(`Installed version differs from lockfile: ${location}`);
      }
      const license = installed.license || entry.license;
      const declaredLicense = typeof license === 'string' ? license
        : license && typeof license.type === 'string' ? license.type : 'Not declared';
      return {
        name: installed.name,
        version: installed.version,
        declaredLicense,
        location,
        direct: Object.hasOwn(manifest.dependencies || {}, installed.name)
          && location === `node_modules/${installed.name}`,
        files: collectFiles(packageRoot, installed),
      };
    })
    .sort((a, b) => Number(b.direct) - Number(a.direct) || collate(a.name, b.name) || collate(a.version, b.version) || collate(a.location, b.location));
  return {
    coverage: 'Installed npm packages marked non-development in frontend/package-lock.json, including native React Native packages. Texts come from package-root LICENSE, COPYING and NOTICE files and license/notice directories, plus explicitly version-verified upstream fallbacks recorded in scripts/license-fallbacks/sources.json. Packages with neither source show declared license metadata only. External native SDKs, platform software, and media assets are outside this list.',
    packages,
  };
}

if (require.main === module) {
  const notices = generateNotices();
  const output = `${JSON.stringify(notices, null, 2)}\n`;
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== output) {
      throw new Error('Third-party notices are stale. Run npm run licenses:generate.');
    }
    process.stdout.write('Third-party notices match the lockfile, installed license files and verified fallbacks.\n');
  } else {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output);
    process.stdout.write(`Generated ${notices.packages.length} package notices.\n`);
  }
}

module.exports = { generateNotices };
