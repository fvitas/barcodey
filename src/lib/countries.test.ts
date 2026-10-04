import { describe, expect, it } from 'vitest'
import { countryFlag, countryName, isCountryCode, listCountries, searchCountries } from '@/lib/countries'

describe('countryName', () => {
  it('resolves english names from iso codes', () => {
    expect(countryName('rs')).toBe('Serbia')
    expect(countryName('de')).toBe('Germany')
  })

  it('falls back to the code for unknown input', () => {
    expect(countryName('!!')).toBe('!!')
  })
})

describe('countryFlag', () => {
  it('builds the emoji flag from the code', () => {
    expect(countryFlag('rs')).toBe('🇷🇸')
    expect(countryFlag('DE')).toBe('🇩🇪')
  })
})

describe('isCountryCode', () => {
  it('accepts known codes and rejects unknown ones', () => {
    expect(isCountryCode('rs')).toBe(true)
    expect(isCountryCode('xx')).toBe(false)
  })
})

describe('listCountries', () => {
  it('lists every iso country sorted by name', () => {
    const countries = listCountries()
    expect(countries).toHaveLength(249)
    const names = countries.map(country => country.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })
})

describe('searchCountries', () => {
  it('returns the full list for an empty query', () => {
    expect(searchCountries('  ')).toHaveLength(249)
  })

  it('ranks prefix matches before substring matches', () => {
    const names = searchCountries('ge').map(country => country.name)
    expect(names[0]).toBe('Georgia')
    expect(names).toContain('Algeria')
    expect(names.indexOf('Germany')).toBeLessThan(names.indexOf('Algeria'))
  })

  it('matches case-insensitively', () => {
    expect(searchCountries('SERB')[0]?.name).toBe('Serbia')
  })
})
