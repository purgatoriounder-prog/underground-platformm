const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuração dos repositórios (paths relativos a este arquivo)
const repos = [
  { name: 'backend', path: path.resolve(__dirname, '..', '..', 'codespaces-jupyter'), port: process.env.BACKEND_PORT || 8080 },
  { name: 'frontend', path: path.resolve(__dirname, '..'), port: process.env.FRONTEND_PORT || 3000 },
  { name: 'extra', path: path.resolve(__dirname, '..', '..', 'nextjs'), port: process.env.EXTRA_PORT || 3001 }
];

function loadEnv(envDir) {
  try {
    const envFile = path.join(envDir, '.env');
    if (!fs.existsSync(envFile)) return {};
    const content = fs.readFileSync(envFile, 'utf-8');
    return content.split('\n').reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return acc;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return acc;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
  } catch (err) {
    console.error('Erro ao ler .env:', err);
    return {};
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Gera um arquivo .env.local para o frontend com a URL correta do backend
function generateFrontendEnv() {
  const backendRepo = repos.find(r => r.name === 'backend');
  if (!backendRepo) return;
  const envVars = loadEnv(backendRepo.path);
  const apiUrl = process.env.NODE_ENV === 'production'
    ? (process.env.NOTEBOOK_RUNNER_URL || 'https://backend-prod.example.com/api')
    : (envVars.NOTEBOOK_RUNNER_URL || `http://localhost:${backendRepo.port}/api`);

  const frontendDir = path.join(repos.find(r => r.name === 'frontend').path, 'frontend');
  // If repo structure uses /frontend folder, use it; otherwise write to repo root
  const frontendTargetDir = fs.existsSync(frontendDir) ? frontendDir : repos.find(r => r.name === 'frontend').path;
  ensureDir(frontendTargetDir);
  const frontendEnvPath = path.join(frontendTargetDir, '.env.local');
  const content = `NEXT_PUBLIC_API_URL=${apiUrl}\n`;
  fs.writeFileSync(frontendEnvPath, content);
  console.log(`✅ .env.local gerado em ${frontendEnvPath} com NEXT_PUBLIC_API_URL=${apiUrl}`);
}

// Sincroniza dependências comuns (modifica package.json diretamente)
function syncDependencies() {
  const commonDeps = {
    'react': '^18.3.1',
    'next': '^14.2.5',
    'axios': '^1.7.2'
  };
  repos.forEach(repo => {
    const pkgPath = path.join(repo.path, 'package.json');
    if (!fs.existsSync(pkgPath)) return;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      pkg.dependencies = pkg.dependencies || {};
      pkg.devDependencies = pkg.devDependencies || {};
      Object.keys(commonDeps).forEach(dep => {
        if (pkg.dependencies[dep]) pkg.dependencies[dep] = commonDeps[dep];
        if (pkg.devDependencies[dep]) pkg.devDependencies[dep] = commonDeps[dep];
      });
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`✅ Dependências sincronizadas em ${pkgPath}`);
    } catch (err) {
      console.error(`Erro ao sincronizar ${pkgPath}:`, err);
    }
  });
}

// Inicia todos os serviços em paralelo (desanexados)
function startAll() {
  console.log('🚀 Iniciando todos os serviços em paralelo (logs no console)');
  repos.forEach(repo => {
    const repoPath = repo.path;
    if (!fs.existsSync(repoPath)) {
      console.warn(`⚠️  Diretório não encontrado: ${repoPath} — pulando ${repo.name}`);
      return;
    }
    console.log(`▶️  Iniciando ${repo.name} em ${repoPath} (npm run dev)`);
    const child = spawn('npm', ['run', 'dev'], {
      cwd: repoPath,
      stdio: 'inherit',
      shell: true,
      detached: false
    });
    child.on('error', (err) => console.error(`Erro ao iniciar ${repo.name}:`, err));
  });
}

// CLI
const command = process.argv[2];
switch (command) {
  case 'gen-env':
    generateFrontendEnv();
    break;
  case 'sync-deps':
    syncDependencies();
    break;
  case 'start':
    startAll();
    break;
  default:
    console.log(`Uso:\n  node bridge.js gen-env      → Gera .env.local do frontend\n  node bridge.js sync-deps    → Sincroniza dependências comuns\n  node bridge.js start        → Inicia todos os serviços em modo desenvolvimento`);
}
