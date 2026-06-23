import api from '@/lib/api'

export const fetcher = <T = unknown>(url: string): Promise<T> =>
  api.get<T>(url).then((res) => res.data)
