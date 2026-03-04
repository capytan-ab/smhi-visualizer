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
import { useActionState, useEffect, useRef } from 'react'

export default function Inputs() {
  const startYear = 2025
  const endYear = 1955
  const length = startYear - endYear + 1
  const years = Array.from({ length }, (_, i) => startYear - i)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [state, formAction, pending] = useActionState(submitAddress, undefined)

  const searchParamsRef = useRef(searchParams)

  useEffect(() => {
    searchParamsRef.current = searchParams
  }, [searchParams])

  function changeYear(value: string) {
    router.push(
      `${pathname}?${new URLSearchParams({
        ...Object.fromEntries(searchParams.entries()),
        year: value,
      })}`,
    )
  }

  useEffect(() => {
    if (!state || 'error' in state) return

    router.push(
      `${pathname}?${new URLSearchParams({
        ...Object.fromEntries(searchParamsRef.current.entries()),
        lat: state.lat.toString(),
        lng: state.lng.toString(),
        address: state.address,
      })}`,
    )
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
              defaultValue={searchParams.get('year') ?? undefined}
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
              defaultValue={searchParams.get('address') ?? undefined}
            />
          </Field>
        </FieldGroup>
      </FieldSet>
      <Field orientation="horizontal" className="mt-4">
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          Submit
        </Button>
      </Field>
    </form>
  )
}
