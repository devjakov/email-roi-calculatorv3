const fs = require('fs')
const path = require('path')

const proofDir = path.join(__dirname, 'public', 'images', 'proof')

const getImages = (dir) => {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => /\.(png|jpe?g|webp|svg|gif)$/i.test(f))
    .sort()
}

const manifest = {
  klaviyo: getImages(path.join(proofDir, 'klaviyo')),
  slack: getImages(path.join(proofDir, 'slack'))
}

fs.writeFileSync(
  path.join(proofDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
)

console.log('Proof manifest generated:', JSON.stringify(manifest))
