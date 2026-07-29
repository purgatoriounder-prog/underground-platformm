#!/usr/bin/env bash
set -euo pipefail

# Ajuste se necessário (SSH ou HTTPS)
SOURCE_REPO="git@github.com:purgatoriounder-prog/nextjs.git"
TARGET_REPO="git@github.com:purgatoriounder-prog/underground-platformm.git"
BRANCH="merge-nextjs"

WORKDIR="$(mktemp -d)"
echo "Working in $WORKDIR"
cd "$WORKDIR"

echo "Cloning target repo..."
git clone "$TARGET_REPO" target
cd target

echo "Creating branch $BRANCH..."
git checkout -b "$BRANCH"

cd ..
echo "Cloning source repo (shallow)..."
git clone --depth 1 "$SOURCE_REPO" nextjs-temp

# Ensure frontend/ exists in target
mkdir -p target/frontend

echo "Copying files from nextjs into target/frontend (preserve existing target files)..."
# --ignore-existing: do not overwrite files already present in target/frontend
rsync -av --exclude='.git' --ignore-existing nextjs-temp/ target/frontend/

# Write the merged package.json into target/frontend/package.json
cat > target/frontend/package.json <<'JSON'
{
  "name": "underground-techno-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "vercel-build": "next build",
    "lint": "eslint"
  },
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "firebase": "^10.12.0",
    "axios": "^1.7.2",
    "lucide-react": "^0.399.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^9",
    "typescript": "^5"
  }
}
JSON

cd target

echo "Staging changes..."
git add frontend

git commit -m "Integrate nextjs into frontend/ (preserve existing frontend files; merged package.json)"
echo "Pushing branch $BRANCH..."
git push origin "$BRANCH"

echo "Cleanup..."
cd ..
rm -rf nextjs-temp

echo "Done. Branch '$BRANCH' pushed. Open a PR on GitHub to review before merge."
