export function VisuPhyPolarizationEmbed() {
  return (
    <div className="flex h-[78dvh] min-h-[440px] max-h-[960px] min-w-0 flex-col overflow-hidden rounded-xl bg-slate-950 sm:h-[calc(100dvh-240px)] sm:min-h-[480px]">
      <iframe
        title="3D Polarization Optical Path Simulator"
        src="/vendor/visuphy-polarization/polarization-embed.html"
        className="min-h-0 w-full flex-1 border-0"
        loading="eager"
        sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-modals"
      />
    </div>
  )
}
