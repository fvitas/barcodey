import { brandLogoStyle, type BrandLogoCell } from '@/lib/brands'

type BrandLogoProps = {
  logo: BrandLogoCell
  className: string // must size the element square — the sprite cell is square
}

export function BrandLogo({ logo, className }: BrandLogoProps) {
  return <span className={`block shrink-0 bg-no-repeat ${className}`} style={brandLogoStyle(logo)} />
}
