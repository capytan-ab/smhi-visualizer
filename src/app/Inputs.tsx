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

export default function Inputs() {
  const startYear = 2025
  const endYear = 1955
  const length = startYear - endYear + 1
  const years = Array.from({ length }, (_, i) => startYear - i)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function changeYear(value: string) {
    router.push(
      `${pathname}?${new URLSearchParams({
        ...Object.fromEntries(searchParams.entries()),
        year: value,
      })}`,
    )
  }

  function changeAddress(value: string) {
    router.push(
      `${pathname}?${new URLSearchParams({
        ...Object.fromEntries(searchParams.entries()),
        address: value,
      })}`,
    )
  }

  return (
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
            placeholder="Address"
            onChange={(e) => changeAddress(e.target.value)}
            defaultValue={searchParams.get('address') ?? undefined}
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
