'use server'

export type GeocodeResult =
  | { lat: number; lng: number; address: string | undefined }
  | { error: string }

export async function submitAddress(
  _prev: GeocodeResult | undefined,
  formData: FormData,
): Promise<GeocodeResult> {
  const address = formData.get('address')?.toString().trim()
  let latitude = parseFloat(formData.get('lat')?.toString().trim() ?? '0')
  let longitude = parseFloat(formData.get('lng')?.toString().trim() ?? '0')

  if (!address && (!latitude || !longitude)) {
    return { error: 'Address or latitude and longitude are required' }
  }

  if (address) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return { error: 'Google Maps API key is not configured' }
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`

    const res = await fetch(url)
    if (!res.ok) {
      return { error: `Geocoding request failed: ${res.statusText}` }
    }

    const data = await res.json()

    if (data.status !== 'OK' || !data.results?.length) {
      return { error: `Could not geocode address: ${data.status}` }
    }

    const { lat, lng } = data.results[0].geometry.location

    latitude = lat
    longitude = lng
  }

  return { lat: latitude, lng: longitude, address }
}
