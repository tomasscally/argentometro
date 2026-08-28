import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SnapshotMissingError,
  SnapshotUnreachableError,
  fetchSnapshot,
  parseSnapshot,
} from '../snapshot'

const valido = {
  indicatorId: 'inflation',
  label: 'Inflación (IPC)',
  frequency: 'mensual',
  unit: '% mensual',
  fetchedAt: '2026-08-28T00:00:00.000Z',
  sourceIds: ['datos-gob-ar'],
  provenance: [
    { seriesId: 'x', sourceId: 'datos-gob-ar', url: 'https://x', rows: 1, sha256: 'a' },
  ],
  points: [{ date: '2024-01-01', value: 20.6 }],
}

function respond(body: string, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(body),
  } as unknown as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('lectura de la copia local', () => {
  it('reintenta ante un fallo de red y se recupera solo', async () => {
    // El caso real: el servidor de desarrollo se reinicia y corta los pedidos
    // en curso. Que vuelva en el segundo intento no es un error del dato.
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(respond(JSON.stringify(valido)))
    vi.stubGlobal('fetch', fetchMock)

    const file = await fetchSnapshot('inflation')
    expect(file.points).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('se rinde con un mensaje claro si la red no vuelve', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(fetchSnapshot('inflation')).rejects.toBeInstanceOf(SnapshotUnreachableError)
    // El mensaje explica qué pasó, no repite el error crudo del navegador.
    await expect(fetchSnapshot('inflation')).rejects.toThrow(/No se pudo contactar/)
  })

  it('no reintenta cuando el archivo no existe', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond('', 404))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchSnapshot('inflation')).rejects.toBeInstanceOf(SnapshotMissingError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('detecta que el servidor devolvió HTML en vez del archivo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond('<!doctype html><html>')))
    await expect(fetchSnapshot('inflation')).rejects.toBeInstanceOf(SnapshotMissingError)
  })
})

describe('validación de la copia', () => {
  it('acepta una copia bien formada', () => {
    expect(parseSnapshot(valido, 'inflation').points).toHaveLength(1)
  })

  it('rechaza una copia de otro indicador', () => {
    expect(() => parseSnapshot(valido, 'poverty')).toThrow(/se esperaba "poverty"/)
  })

  it('rechaza una copia sin procedencia', () => {
    expect(() => parseSnapshot({ ...valido, provenance: [] }, 'inflation')).toThrow(
      /procedencia/
    )
  })

  it('rechaza una copia sin fecha de captura', () => {
    expect(() => parseSnapshot({ ...valido, fetchedAt: '' }, 'inflation')).toThrow(
      /cuándo se tomó/
    )
  })

  it('rechaza observaciones mal formadas', () => {
    expect(() =>
      parseSnapshot({ ...valido, points: [{ date: '2024-01-01' }] }, 'inflation')
    ).toThrow(/mal formadas/)
  })
})
