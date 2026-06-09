const fs = require('fs')
const path = require('path')

const imagesRoot = path.join(__dirname, 'public', 'images')

const isImage = (f) => /\.(png|jpe?g|webp|svg|gif)$/i.test(f)

const listImages = (dir) => {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(isImage).sort()
}

// Writes a manifest.json into `groupDir` mapping each subfolder name -> [image files].
// New subfolders and images are picked up automatically; no code changes needed.
const buildGroupManifest = (groupDir) => {
  if (!fs.existsSync(groupDir)) return {}
  const manifest = {}
  for (const entry of fs.readdirSync(groupDir, { withFileTypes: true })) {
    if (entry.isDirectory()) manifest[entry.name] = listImages(path.join(groupDir, entry.name))
  }
  fs.writeFileSync(path.join(groupDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  return manifest
}

const groups = ['proof', 'case-studies', 'brand-results', 'testimonials']
const result = {}
for (const group of groups) {
  result[group] = buildGroupManifest(path.join(imagesRoot, group))
}

console.log('Manifests generated:', JSON.stringify(result))
