type AppWordmarkProps = {
  section?: string
}

// shared across screens so the mark (and its dot) never shifts between routes
export function AppWordmark({ section }: AppWordmarkProps) {
  return (
    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
      Barcodey<span className="text-primary">.</span>
      {section !== undefined && <span className="pl-[2px]">{section}</span>}
    </h1>
  )
}
