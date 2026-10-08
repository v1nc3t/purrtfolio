export function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-black px-6 font-mono text-white">
      <div>
        <p className="m-0 tracking-[0.16em] text-white/45">404</p>
        <p className="m-0 mt-3">no such page.</p>
        <p className="m-0 mt-2 text-white/45">{location.pathname}</p>
        <a href="/terminal" className="mt-6 inline-block text-white/80 no-underline hover:line-through">
          terminal
        </a>
      </div>
    </main>
  )
}
