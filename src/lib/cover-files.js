const fs = require('fs');
const path = require('path');

const COVER_DIR = path.join(__dirname, '..', '..', 'uploads', 'covers');

function coverUrl(filename) {
  return filename ? `/uploads/covers/${filename}` : null;
}

async function removeCover(filename) {
  if (!filename) return;
  const coverPath = path.join(COVER_DIR, path.basename(filename));
  try {
    await fs.promises.unlink(coverPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

module.exports = { coverUrl, removeCover };
