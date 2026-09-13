#!/usr/bin/env node
/**
 * blog <文件.md> -c <notes|essays|docs> [--category <分类>] [--slug <slug>] [--draft] [--no-push]
 *
 * 把任意 md 文件挂载到博客对应集合,自动补全缺失的 frontmatter,
 * 然后 commit + push 到 GitHub 触发部署。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { basename, join, resolve, posix } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://cxy.blog';
const COLLECTIONS = ['notes', 'essays', 'docs'];

function dirname(p) {
  return p.replace(/[\\/][^\\/]+$/, '');
}

function usage() {
  console.log(`用法: blog <文件.md> -c <notes|essays|docs> [选项]

选项:
  -c, --collection   目标集合: notes | essays | docs (必选)
      --category     docs 集合的分类目录,如 security (docs 必填)
      --slug         文章 slug,默认由文件名生成
      --draft        以草稿形式发布 (draft: true,不会出现在列表)
      --no-push      只挂载,不 commit/push
      --force        目标文件已存在时覆盖`);
}

// ---------- args ----------
const args = process.argv.slice(2);
const opts = { collection: null, category: null, slug: null, draft: false, push: true, force: false, file: null };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-c' || a === '--collection') opts.collection = args[++i];
  else if (a === '--category') opts.category = args[++i];
  else if (a === '--slug') opts.slug = args[++i];
  else if (a === '--draft') opts.draft = true;
  else if (a === '--no-push') opts.push = false;
  else if (a === '--force') opts.force = true;
  else if (a === '-h' || a === '--help') { usage(); process.exit(0); }
  else opts.file = a;
}

if (!opts.file || !opts.collection) { usage(); process.exit(1); }
if (!COLLECTIONS.includes(opts.collection)) {
  console.error(`✗ 未知集合 "${opts.collection}",可选: ${COLLECTIONS.join(' | ')}`);
  process.exit(1);
}
if (opts.collection === 'docs' && !opts.category) {
  console.error('✗ docs 集合需要 --category,例如 --category security');
  process.exit(1);
}

const srcPath = resolve(opts.file.replace(/^~(?=\/|\\|$)/, process.env.USERPROFILE ?? '~'));
if (!existsSync(srcPath)) { console.error(`✗ 找不到文件: ${srcPath}`); process.exit(1); }
if (!/\.md$/i.test(srcPath)) { console.error('✗ 只支持 .md 文件'); process.exit(1); }

// ---------- frontmatter ----------
const tagsArr = (v) => Array.isArray(v) ? v : String(v).split(/[,，]/).map(s => s.trim()).filter(Boolean);

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const km = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!km) continue;
    let [, k, v] = km;
    v = v.trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      meta[k] = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if (v === 'true' || v === 'false') {
      meta[k] = v === 'true';
    } else {
      meta[k] = v.replace(/^["']|["']$/g, '');
    }
  }
  return { meta, body: text.slice(m[0].length) };
}

function dumpFrontmatter(meta) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(meta)) {
    if (Array.isArray(v)) lines.push(`${k}: [${v.join(', ')}]`);
    else lines.push(`${k}: ${v}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

const raw = readFileSync(srcPath, 'utf8');
const { meta, body } = parseFrontmatter(raw);

// title: frontmatter > 第一个 # 标题 > 文件名
let title = meta.title;
if (!title) {
  const h1 = body.match(/^#\s+(.+)$/m);
  title = h1 ? h1[1].trim() : basename(srcPath).replace(/\.md$/i, '');
}
// description: frontmatter > 首个非标题、非空段落截断
let description = meta.description;
if (!description) {
  const para = body.split(/\r?\n/).map(l => l.trim())
    .find(l => l && !l.startsWith('#') && !l.startsWith('!') && !l.startsWith('```') && !l.startsWith('|'));
  description = para ? para.replace(/[*_`>\[\]]/g, '').slice(0, 80) : title;
}
// date: frontmatter > 今天
const today = new Date().toISOString().slice(0, 10);
const date = meta.date || today;

// ---------- slug ----------
function makeSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-龥-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
const slug = opts.slug || makeSlug(basename(srcPath).replace(/\.md$/i, ''));
if (!slug) { console.error('✗ 文件名无法生成 slug,请用 --slug 指定'); process.exit(1); }

// ---------- 写入 ----------
const relDir = opts.category ? posix.join('src/content', opts.collection, opts.category) : posix.join('src/content', opts.collection);
const targetRel = posix.join(relDir, `${slug}.md`);
const targetAbs = join(REPO, targetRel);
if (existsSync(targetAbs) && !opts.force) {
  console.error(`✗ 目标已存在: ${targetRel} (用 --force 覆盖)`);
  process.exit(1);
}

const newMeta = {
  title,
  description,
  date,
  ...(opts.collection === 'docs' ? { category: opts.category } : {}),
  ...(opts.collection === 'essays' && meta.image ? { image: meta.image } : {}),
  ...(opts.draft || meta.draft === true ? { draft: true } : {}),
  tags: meta.tags ? tagsArr(meta.tags) : [],
};
mkdirSync(join(REPO, relDir), { recursive: true });
writeFileSync(targetAbs, dumpFrontmatter(newMeta) + body.replace(/^\r?\n+/, ''), 'utf8');

const urlPath = opts.category ? `/${opts.collection}/${opts.category}/${slug}` : `/${opts.collection}/${slug}`;
console.log(`✓ 已挂载: ${targetRel}`);
console.log(`  标题: ${title}`);
console.log(`  地址: ${SITE}${urlPath}`);

// ---------- git ----------
if (!opts.push) { console.log('（--no-push: 未提交)'); process.exit(0); }

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: REPO, encoding: 'utf8' }).trim();
}
try {
  git(`add "${targetRel.replace(/\//g, '/')}"`);
  const status = git('status --porcelain');
  if (!status) { console.log('没有变更需要提交'); process.exit(0); }
  git(`commit -m "post: ${title.replace(/"/g, "'")}"`);
  git('push');
  console.log(`✓ 已推送 GitHub,部署后即可访问`);
} catch (e) {
  console.error(`✗ git 操作失败: ${e.message}`);
  process.exit(1);
}
