import fs from 'fs'
import path from 'path'

const LOOT_DIR = path.join(process.cwd(), 'loot')

export interface LootFile {
  name: string
  path: string
  size: number
  type: string
  mtime: string
  isDirectory: boolean
}

export function listLoot(subDir: string = ''): LootFile[] {
  const fullPath = path.join(LOOT_DIR, subDir)
  
  if (!fs.existsSync(fullPath)) {
    return []
  }

  const entries = fs.readdirSync(fullPath, { withFileTypes: true })
  
  return entries.map(entry => {
    const entryPath = path.join(fullPath, entry.name)
    const stats = fs.statSync(entryPath)
    
    return {
      name: entry.name,
      path: path.relative(LOOT_DIR, entryPath).replace(/\\/g, '/'),
      size: stats.size,
      type: entry.isDirectory() ? 'directory' : path.extname(entry.name).slice(1),
      mtime: stats.mtime.toISOString(),
      isDirectory: entry.isDirectory()
    }
  })
}

export function getLootContent(filePath: string): string | Buffer | null {
  const fullPath = path.join(LOOT_DIR, filePath)
  
  // Security check: ensure path is within LOOT_DIR
  const normalizedPath = path.normalize(fullPath)
  if (!normalizedPath.startsWith(LOOT_DIR)) {
    return null
  }

  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    return null
  }

  return fs.readFileSync(fullPath)
}

export function getLootStats() {
  const getDirSize = (dir: string): number => {
    const files = fs.readdirSync(dir)
    return files.reduce((acc, file) => {
      const filePath = path.join(dir, file)
      const stats = fs.statSync(filePath)
      if (stats.isDirectory()) {
        return acc + getDirSize(filePath)
      }
      return acc + stats.size
    }, 0)
  }

  const categories = ['command_result', 'keylog', 'screenshot', 'system_info']
  const stats: Record<string, { count: number, size: number }> = {}

  categories.forEach(cat => {
    const catPath = path.join(LOOT_DIR, cat)
    if (fs.existsSync(catPath)) {
      const files = fs.readdirSync(catPath)
      stats[cat] = {
        count: files.length,
        size: getDirSize(catPath)
      }
    } else {
      stats[cat] = { count: 0, size: 0 }
    }
  })

  return stats
}
