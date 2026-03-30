import fs from 'fs'
import path from 'path'

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: any
  error?: string
}

class Logger {
  private logDir: string

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs')
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  private formatEntry(entry: LogEntry): string {
    const json = JSON.stringify(entry, null, 2)
    return json
  }

  private writeToFile(entry: LogEntry): void {
    try {
      const date = new Date(entry.timestamp)
      const fileName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`
      const filePath = path.join(this.logDir, fileName)

      const line = `[${entry.timestamp}] [${entry.level}] [${entry.module}] ${entry.message}`
      const fullLine = entry.data ? `${line} - ${JSON.stringify(entry.data)}` : line
      const errorLine = entry.error ? ` - ERROR: ${entry.error}` : ''

      fs.appendFileSync(filePath, fullLine + errorLine + '\n')
    } catch (error) {
      console.error('[Logger] Failed to write to file:', error)
    }
  }

  private log(level: LogLevel, module: string, message: string, data?: any, error?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
      error: error?.message || String(error),
    }

    // Log to console
    const color = this.getLevelColor(level)
    console.log(`${color}[${entry.timestamp}] [${level}] [${module}] ${message}`, data || '')

    // Log to file
    this.writeToFile(entry)
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '\x1b[36m' // Cyan
      case LogLevel.INFO:
        return '\x1b[32m' // Green
      case LogLevel.WARN:
        return '\x1b[33m' // Yellow
      case LogLevel.ERROR:
        return '\x1b[31m' // Red
      case LogLevel.FATAL:
        return '\x1b[35m' // Magenta
      default:
        return ''
    }
  }

  debug(module: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, module, message, data)
  }

  info(module: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, module, message, data)
  }

  warn(module: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, module, message, data)
  }

  error(module: string, message: string, error?: any, data?: any): void {
    this.log(LogLevel.ERROR, module, message, data, error)
  }

  fatal(module: string, message: string, error?: any, data?: any): void {
    this.log(LogLevel.FATAL, module, message, data, error)
  }

  getLogsDirectory(): string {
    return this.logDir
  }

  getLogs(date: Date): string | null {
    try {
      const fileName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`
      const filePath = path.join(this.logDir, fileName)

      if (!fs.existsSync(filePath)) {
        return null
      }

      return fs.readFileSync(filePath, 'utf-8')
    } catch (error) {
      console.error('[Logger] Failed to read log file:', error)
      return null
    }
  }

  listLogs(): string[] {
    try {
      return fs.readdirSync(this.logDir).filter(f => f.endsWith('.log')).sort().reverse()
    } catch (error) {
      console.error('[Logger] Failed to list logs:', error)
      return []
    }
  }
}

export const logger = new Logger()
