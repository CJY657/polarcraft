export function VisuPhyPolarizationEmbed() {
  return (
    <div className="flex h-[70dvh] min-h-[560px] flex-col overflow-hidden rounded-xl bg-slate-950 sm:h-[calc(100dvh-280px)] sm:min-h-[680px]">
      <iframe
        title="3D Polarization Optical Path Simulator"
        src="/vendor/visuphy-polarization/polarization-embed.html"
        className="h-full w-full flex-1 border-0"
        loading="eager"
        sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-modals"
      />
    </div>
  )
}
