import { describe, expect, it } from 'vitest'
import { brandCategoryLabel, brandLogoStyle, groupBrandsByLetter, searchBrands, type Brand } from './brands'

function brand(overrides: Partial<Brand> & { id: string; name: string }): Brand {
  return { countries: ['001'], cat: 'supermarket', color: '#0050aa', logo: { sheet: 0, cell: 0, rows: 1 }, ...overrides }
}

const catalog: Brand[] = [
  brand({ id: 'lidl', name: 'Lidl', aliases: ['lidl deutschland', 'lidl polska'] }),
  brand({ id: 'lidl-bg', name: 'Lidl (bg)', countries: ['bg'] }),
  brand({ id: 'dm', name: 'dm', cat: 'chemist', countries: ['de', 'rs', 'hr'] }),
  brand({ id: 'maxi', name: 'Maxi', countries: ['rs'] }),
  brand({ id: 'delhaize', name: 'AD Delhaize', countries: ['be'] }),
  brand({ id: '99-speedmart', name: '99 Speedmart', countries: ['my'] }),
  brand({ id: 'fast-eddys', name: 'Fast Food Freddy', cat: 'fast_food', aliases: ['freddyland'] }),
]

describe('searchBrands', () => {
  it('returns empty for a blank query', () => {
    expect(searchBrands(catalog, '  ', 'rs')).toEqual([])
  })

  it('ranks name prefix above alias prefix above substring', () => {
    const names = searchBrands(catalog, 'lidl', 'rs').map(entry => entry.id)
    expect(names[0]).toBe('lidl')
    expect(names).toContain('lidl-bg')
  })

  it('matches aliases case-insensitively', () => {
    expect(searchBrands(catalog, 'FREDDYLAND', undefined).map(entry => entry.id)).toEqual(['fast-eddys'])
  })

  it('boosts brands available in the user country', () => {
    // dm (rs) and AD Delhaize (be) both substring-match 'd'; the local one wins its rank tie
    const ids = searchBrands(catalog, 'd', 'rs').map(entry => entry.id)
    expect(ids.indexOf('dm')).toBeLessThan(ids.indexOf('delhaize'))
  })

  it('finds substring matches anywhere in the name', () => {
    expect(searchBrands(catalog, 'speedmart', undefined).map(entry => entry.id)).toEqual(['99-speedmart'])
  })
})

describe('groupBrandsByLetter', () => {
  it('groups alphabetically with sorted brands inside each group', () => {
    const groups = groupBrandsByLetter(catalog)
    const letters = groups.map(group => group.letter)
    expect(letters).toEqual([...letters].sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b))))
    const l = groups.find(group => group.letter === 'L')
    expect(l?.brands.map(entry => entry.name)).toEqual(['Lidl', 'Lidl (bg)'])
  })

  it('pools digit-initial names under #', () => {
    const hash = groupBrandsByLetter(catalog).find(group => group.letter === '#')
    expect(hash?.brands.map(entry => entry.id)).toEqual(['99-speedmart'])
    // and # sorts last
    expect(groupBrandsByLetter(catalog).at(-1)?.letter).toBe('#')
  })

  it('uppercases lowercase brand initials into their letter group', () => {
    const d = groupBrandsByLetter(catalog).find(group => group.letter === 'D')
    expect(d?.brands.map(entry => entry.id)).toContain('dm')
  })
})

describe('brandCategoryLabel', () => {
  it('prettifies category slugs', () => {
    expect(brandCategoryLabel(brand({ id: 'x', name: 'X', cat: 'fast_food' }))).toBe('Fast food')
    expect(brandCategoryLabel(brand({ id: 'y', name: 'Y' }))).toBe('Supermarket')
  })
})

describe('brandLogoStyle', () => {
  it('scales the sheet so one 96px cell fills the element', () => {
    const style = brandLogoStyle({ sheet: 3, cell: 0, rows: 2 })
    expect(style.backgroundImage).toBe('url(/brands/logos-3.webp)')
    expect(style.backgroundSize).toBe(`${(1_664 / 96) * 100}% ${(208 / 96) * 100}%`)
  })

  it('positions on the cell inside its gutter', () => {
    expect(brandLogoStyle({ sheet: 0, cell: 0, rows: 2 }).backgroundPosition).toBe(`${(4 / 1_568) * 100}% ${(4 / 112) * 100}%`)
    expect(brandLogoStyle({ sheet: 0, cell: 17, rows: 2 }).backgroundPosition).toBe(
      `${(108 / 1_568) * 100}% ${(108 / 112) * 100}%`,
    )
  })
})
