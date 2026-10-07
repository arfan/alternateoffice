import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { appBinaryForResources } from '../src/resources'

describe('appBinaryForResources', () => {
  it('finds the app in a custom Windows install directory', () => {
    expect(appBinaryForResources(join('D:\\Apps\\AlternateOffice', 'resources'), 'win32')).toBe(
      join('D:\\Apps\\AlternateOffice', 'AlternateOffice.exe'),
    )
  })

  it('resolves the same binary for the default Windows install directory', () => {
    const localAppData = 'C:\\Users\\test\\AppData\\Local'
    const resources = join(localAppData, 'Programs', 'AlternateOffice', 'resources')
    expect(appBinaryForResources(resources, 'win32')).toBe(
      join(localAppData, 'Programs', 'AlternateOffice', 'AlternateOffice.exe'),
    )
  })

  it('finds the app in a custom macOS bundle location', () => {
    expect(
      appBinaryForResources(join('/Volumes/Work/AlternateOffice.app/Contents/Resources'), 'darwin'),
    ).toBe(join('/Volumes/Work/AlternateOffice.app/Contents/MacOS/AlternateOffice'))
  })

  it('finds the app in a custom Linux prefix', () => {
    expect(appBinaryForResources(join('/opt/alternateoffice-custom/resources'), 'linux')).toBe(
      join('/opt/alternateoffice-custom/alternateoffice'),
    )
  })
})
