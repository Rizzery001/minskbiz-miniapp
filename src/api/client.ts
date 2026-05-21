import { getInitData } from '../lib/telegram'

const baseUrl = import.meta.env.VITE_API_BASE

export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type QueryValue = string | number | boolean | undefined | null

async function request<T>(
  path: string,
  init?: RequestInit & { multipart?: boolean },
): Promise<T> {
  if (!baseUrl) {
    throw new ApiError(0, 'VITE_API_BASE is not configured', 'config_error')
  }

  const initData = getInitData()
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  }
  // For multipart, let the browser set Content-Type with the right boundary.
  if (!init?.multipart) {
    headers['Content-Type'] = 'application/json'
  }
  if (initData) {
    headers['X-Telegram-Init-Data'] = initData
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}${path}`, { ...init, headers })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    throw new ApiError(0, message, 'network_error')
  }

  if (!res.ok) {
    let body: { code?: string; message?: string; detail?: string } = {}
    try {
      body = (await res.json()) as typeof body
    } catch {
      // ignore parse errors — keep defaults
    }

    if (res.status === 401) {
      throw new ApiError(
        401,
        body.message ?? body.detail ?? 'Откройте через Telegram',
        'unauthorized',
      )
    }
    throw new ApiError(
      res.status,
      body.message ?? body.detail ?? res.statusText,
      body.code,
    )
  }

  if (res.status === 204) {
    return undefined as T
  }

  return (await res.json()) as T
}

export function apiGet<T>(
  path: string,
  params?: Record<string, QueryValue>,
): Promise<T> {
  let url = path
  if (params) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      search.set(key, String(value))
    }
    const qs = search.toString()
    if (qs) url += `?${qs}`
  }
  return request<T>(url, { method: 'GET' })
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}

export function apiUpload<T>(path: string, file: File, field = 'file'): Promise<T> {
  const form = new FormData()
  form.append(field, file)
  return request<T>(path, { method: 'POST', body: form, multipart: true })
}
