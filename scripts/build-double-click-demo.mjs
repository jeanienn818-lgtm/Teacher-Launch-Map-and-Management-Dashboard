import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const distDir = path.join(projectRoot, 'dist')
const assetsDir = path.join(distDir, 'assets')
const outputDir =
  process.argv[2] ||
  path.join(projectRoot, 'double-click-demo')

fs.mkdirSync(outputDir, { recursive: true })

const cssFile = fs.readdirSync(assetsDir).find((file) => file.endsWith('.css'))
const jsFile = fs
  .readdirSync(assetsDir)
  .find((file) => file.startsWith('index-') && file.endsWith('.js'))

if (!cssFile || !jsFile) {
  throw new Error('Missing Vite CSS or entry JS asset. Run npm run build first.')
}

const css = fs
  .readFileSync(path.join(assetsDir, cssFile), 'utf8')
  .replace(/<\/style/gi, '<\\/style')
const js = fs
  .readFileSync(path.join(assetsDir, jsFile), 'utf8')
  .replace(/<\/script/gi, '<\\/script')

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Teacher Success Operating System · Local Demo</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
${js}
    </script>
  </body>
</html>
`

fs.writeFileSync(path.join(outputDir, 'index.html'), html)

console.log(
  JSON.stringify(
    {
      outputDir,
      cssFile,
      jsFile,
      htmlBytes: Buffer.byteLength(html),
    },
    null,
    2,
  ),
)
