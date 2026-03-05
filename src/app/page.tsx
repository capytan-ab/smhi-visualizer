import Inputs from './Inputs'
import styles from './page.module.css'
import { ChartBarMultiple } from '@/components/chart-bar-multiple'

const BACKEND_URL = process.env.BACKEND_URL

if (!BACKEND_URL) {
  throw new Error('BACKEND_URL is not set')
}

async function fetchBackend<T>(
  path: string,
): Promise<{ data: T } | { error: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { cache: 'no-store' })

    if (!res.ok) {
      const body = await res.json()

      return {
        error:
          body?.detail ?? `Request failed: ${res.status} ${res.statusText}`,
      }
    }

    return { data: await res.json() }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type CloudResult =
  | {
      data: {
        year: number
        lat: number
        lng: number
        station_name: string
        station_id: number
        station_lat: number
        station_lon: number
        station_distance_km: number
        monthly_avg_cloud_pct: {
          '10': number
          '11': number
          '12': number
          '01': number
          '02': number
          '03': number
          '04': number
          '05': number
          '06': number
          '07': number
          '08': number
          '09': number
        }
        monthly_obs_count: {
          '10': number
          '11': number
          '12': number
          '01': number
          '02': number
          '03': number
          '04': number
          '05': number
          '06': number
          '07': number
          '08': number
          '09': number
        }
      }
    }
  | { error: { msg: string }[] | string }

type LightningResult =
  | {
      data: {
        year: number
        lat: number
        lon: number
        radius_km: number
        monthly_counts: {
          '10': number
          '11': number
          '12': number
          '01': number
          '02': number
          '03': number
          '04': number
          '05': number
          '06': number
          '07': number
          '08': number
          '09': number
        }
        monthly_daily_probability: {
          '10': number
          '11': number
          '12': number
          '01': number
          '02': number
          '03': number
          '04': number
          '05': number
          '06': number
          '07': number
          '08': number
          '09': number
        }
      }
    }
  | { error: { msg: string }[] | string }

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const year = typeof params.year === 'string' ? params.year : undefined
  const lat = typeof params.lat === 'string' ? params.lat : undefined
  const lng = typeof params.lng === 'string' ? params.lng : undefined

  let cloudResult: CloudResult | null = null
  let lightningResult: LightningResult | null = null

  if (year && lat && lng) {
    const query = `year=${year}&lat=${lat}&lon=${lng}`

    ;[cloudResult, lightningResult] = await Promise.all([
      fetchBackend(`/cloud/monthly?${query}`) as Promise<CloudResult>,
      fetchBackend(`/lightning/monthly?${query}`) as Promise<LightningResult>,
    ])
  }

  return (
    <main className={styles.main}>
      <Inputs />
      {cloudResult &&
        'data' in cloudResult &&
        lightningResult &&
        'data' in lightningResult && (
          <ChartBarMultiple
            cloudPct={cloudResult.data.monthly_avg_cloud_pct}
            lightningProb={lightningResult.data.monthly_daily_probability}
            year={cloudResult.data.year}
          />
        )}
      {cloudResult && 'error' in cloudResult && (
        <div className="text-destructive">
          Cloud data error:{' '}
          {typeof cloudResult.error === 'string'
            ? cloudResult.error
            : cloudResult.error.map((e) => e.msg).join(', ')}
        </div>
      )}
      {lightningResult && 'error' in lightningResult && (
        <div className="text-destructive">
          Lightning data error:{' '}
          {typeof lightningResult.error === 'string'
            ? lightningResult.error
            : lightningResult.error.map((e) => e.msg).join(', ')}
        </div>
      )}
    </main>
  )
}
