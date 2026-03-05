'use client'

import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { submitAddress } from './action'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'

export default function Inputs() {
  const startYear = 2025
  const endYear = 2012
  const length = startYear - endYear + 1
  const years = Array.from({ length }, (_, i) => startYear - i)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [address, setAddress] = useState(searchParams.get('address') ?? '')
  const [year, setYear] = useState(searchParams.get('year') ?? '')
  const [lat, setLat] = useState(searchParams.get('lat') ?? '')
  const [lng, setLng] = useState(searchParams.get('lng') ?? '')

  const [state, formAction, pendingAction] = useActionState(
    submitAddress,
    undefined,
  )
  const [isPending, startTransition] = useTransition()

  const searchParamsRef = useRef(searchParams)
  const yearRef = useRef(year)

  useEffect(() => {
    searchParamsRef.current = searchParams
  }, [searchParams])

  useEffect(() => {
    yearRef.current = year
  }, [year])

  function changeYear(value: string) {
    setYear(value)
  }

  useEffect(() => {
    if (!state || 'error' in state) return

    startTransition(() => {
      setLat(state.lat.toString())
      setLng(state.lng.toString())
      setAddress(state.address ?? '')
      router.push(
        `${pathname}?${new URLSearchParams({
          ...Object.fromEntries(searchParamsRef.current.entries()),
          lat: state.lat.toString(),
          lng: state.lng.toString(),
          address: state.address ?? '',
          year: yearRef.current,
        })}`,
      )
    })
  }, [state, router, pathname])

  return (
    <form action={formAction}>
      <FieldSet>
        <FieldGroup className="flex flex-row gap-4">
          <Field>
            <FieldLabel htmlFor="year">Year</FieldLabel>
            <Select
              name="year"
              onValueChange={(value) => changeYear(value)}
              value={year || undefined}
            >
              <SelectTrigger className="w-45" id="year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="address">Address</FieldLabel>
            <Input
              id="address"
              name="address"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>
        </FieldGroup>
        <FieldGroup className="flex flex-row gap-4">
          <Field>
            <FieldLabel htmlFor="lat">Latitude</FieldLabel>
            <Input
              id="lat"
              name="lat"
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              disabled={Boolean(address)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lng">Longitude</FieldLabel>
            <Input
              id="lng"
              name="lng"
              placeholder="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              disabled={Boolean(address)}
            />
          </Field>
        </FieldGroup>
      </FieldSet>
      <Field orientation="horizontal" className="mt-4">
        <Button type="submit" disabled={isPending || pendingAction}>
          {isPending || pendingAction ? <Spinner /> : null}
          Submit
        </Button>
      </Field>
    </form>
  )
}
