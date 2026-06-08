interface GlobalHintStripProps {
  text: string
}

export function GlobalHintStrip({ text }: GlobalHintStripProps) {
  return <div className="global-hint-strip">{text}</div>
}
