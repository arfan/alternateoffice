import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { realizedPath } from './fs'
import { CliError, EXIT } from './result'

/** The shell's Electron userData directory, located without Electron (ALTERNATEOFFICE_USER_DATA overrides). */
export function alternateofficeUserDataDir(env: NodeJS.ProcessEnv): string {
  if (env.ALTERNATEOFFICE_USER_DATA) return env.ALTERNATEOFFICE_USER_DATA
  if (env.GENOFFICE_USER_DATA) return env.GENOFFICE_USER_DATA
  // Resolve the home from the env we were given (as os.homedir() does with process.env.HOME), so
  // an in-process caller with a substituted HOME never lands in the real user directories.
  const home = env.HOME || homedir()
  const base =
    process.platform === 'darwin'
      ? join(home, 'Library', 'Application Support')
      : process.platform === 'win32'
        ? env.APPDATA || join(home, 'AppData', 'Roaming')
        : env.XDG_CONFIG_HOME || join(home, '.config')
  return join(base, 'GenOffice')
}

export interface GuiOpenDocuments {
  pid: number
  paths: string[]
}

/**
 * Files the running AlternateOffice shell has open, from the registries it publishes
 * on every tab change (apps/shell/src/main/open-documents.ts). Empty when no
 * shell is running: a registry whose pid is gone is a crash leftover.
 */
export function guiOpenDocuments(
  env: NodeJS.ProcessEnv,
  dirs = env.ALTERNATEOFFICE_USER_DATA
    ? [env.ALTERNATEOFFICE_USER_DATA]
    : [alternateofficeUserDataDir(env), `${alternateofficeUserDataDir(env)} Dev`],
): GuiOpenDocuments[] {
  const live: GuiOpenDocuments[] = []
  for (const dir of dirs) {
    const path = join(dir, 'open-documents.json')
    if (!existsSync(path)) continue
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as Partial<GuiOpenDocuments>
      if (typeof raw.pid !== 'number' || !Array.isArray(raw.paths)) continue
      if (!processAlive(raw.pid)) continue
      live.push({
        pid: raw.pid,
        paths: raw.paths.filter((p): p is string => typeof p === 'string'),
      })
    } catch {
      continue
    }
  }
  return live
}

function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/** Refuses to write a document the editor is showing; `--force` skips this. */
export function assertNotOpenInGui(abs: string, env: NodeJS.ProcessEnv): void {
  const target = realizedPath(abs)
  for (const open of guiOpenDocuments(env)) {
    if (!open.paths.some((p) => realizedPath(p) === target)) continue
    throw new CliError(
      EXIT.file,
      `AlternateOffice has this file open: ${abs}`,
      { gui_pid: open.pid },
      {
        reason: 'file_open_in_gui',
        suggestion:
          'close the tab in AlternateOffice first, or pass --force to write anyway (the editor may overwrite your change on its next save)',
      },
    )
  }
}
