const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const readFile = (relativePath) => fs.readFileSync(path.join(rootDir, relativePath), 'utf8');

const failures = [];

const expectIncludes = (content, value, filePath, reason) => {
  if (!content.includes(value)) {
    failures.push(`${filePath} is missing \`${value}\`${reason ? ` (${reason})` : ''}.`);
  }
};

const expectExcludes = (content, value, filePath, reason) => {
  if (content.includes(value)) {
    failures.push(`${filePath} should not include \`${value}\`${reason ? ` (${reason})` : ''}.`);
  }
};

const renderEnvTemplatePath = 'render.env.template';
const netlifyEnvTemplatePath = 'netlify.env.template';
const renderYamlPath = 'render.yaml';
const deployNetlifyPath = 'DEPLOY_NETLIFY.md';
const publicReleaseChecklistPath = path.join('docs', 'PUBLIC_RELEASE_CHECKLIST.md');
const previewValidationPath = path.join('docs', 'DEPLOY_PREVIEW_VALIDATION.md');

const renderEnvTemplate = readFile(renderEnvTemplatePath);
const netlifyEnvTemplate = readFile(netlifyEnvTemplatePath);
const renderYaml = readFile(renderYamlPath);
const deployNetlify = readFile(deployNetlifyPath);
const publicReleaseChecklist = readFile(publicReleaseChecklistPath);
const previewValidation = readFile(previewValidationPath);

[
  'MONGO_URI=',
  'SESSION_SECRET=',
  'CORS_ORIGINS=',
  'RECAPTCHA_SECRET_KEY=',
  'REACT_APP_API_URL=',
  'REACT_APP_RECAPTCHA_SITE_KEY=',
].forEach((value) => expectIncludes(renderEnvTemplate, value, renderEnvTemplatePath, 'Render template should cover backend and static-frontend env vars'));

[
  'BACKEND_API_URL=',
  'REACT_APP_RECAPTCHA_SITE_KEY=',
].forEach((value) => expectIncludes(netlifyEnvTemplate, value, netlifyEnvTemplatePath, 'Netlify deploy requires these frontend env vars'));

expectExcludes(
  netlifyEnvTemplate,
  'REACT_APP_API_URL=',
  netlifyEnvTemplatePath,
  'the standard Netlify deploy uses BACKEND_API_URL through the function proxy'
);

[
  'RECAPTCHA_SECRET_KEY',
  'CORS_ORIGINS',
  'REACT_APP_API_URL',
  'REACT_APP_RECAPTCHA_SITE_KEY',
].forEach((value) => expectIncludes(renderYaml, value, renderYamlPath, 'Render blueprint should expose the documented env vars'));

expectIncludes(deployNetlify, 'BACKEND_API_URL', deployNetlifyPath, 'Netlify deploy doc should use the proxy backend variable');
expectIncludes(deployNetlify, 'REACT_APP_RECAPTCHA_SITE_KEY', deployNetlifyPath, 'Netlify deploy doc should include live reCAPTCHA setup');

expectIncludes(publicReleaseChecklist, 'BACKEND_API_URL', publicReleaseChecklistPath, 'release checklist should reflect the Netlify proxy path');
expectIncludes(publicReleaseChecklist, 'REACT_APP_API_URL', publicReleaseChecklistPath, 'release checklist should document the direct-API exception');
expectIncludes(previewValidation, 'BACKEND_API_URL', previewValidationPath, 'preview validation should reflect the Netlify proxy path');
expectIncludes(previewValidation, 'REACT_APP_API_URL', previewValidationPath, 'preview validation should document the direct-API exception');

if (failures.length) {
  console.error('Deploy config check failed.');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Deploy config check passed.');
console.log(`Validated: ${renderEnvTemplatePath}, ${netlifyEnvTemplatePath}, ${renderYamlPath}, ${deployNetlifyPath}, ${publicReleaseChecklistPath}, ${previewValidationPath}`);
