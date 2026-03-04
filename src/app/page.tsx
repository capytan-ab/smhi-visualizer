import Inputs from './Inputs'
import styles from './page.module.css'

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
  | { error: string }

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
  | { error: string }

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
          <div>
            <h2>Cloud Data</h2>
            <pre>{JSON.stringify(cloudResult.data, null, 2)}</pre>
            <h2>Lightning Data</h2>
            <pre>{JSON.stringify(lightningResult.data, null, 2)}</pre>
          </div>
        )}
      {cloudResult && 'error' in cloudResult && (
        <span className="text-destructive">
          Cloud data error: {cloudResult.error}
        </span>
      )}
      {lightningResult && 'error' in lightningResult && (
        <span className="text-destructive">
          Lightning data error: {lightningResult.error}
        </span>
      )}
    </main>
  )
}
