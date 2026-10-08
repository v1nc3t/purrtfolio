import { useSettings } from './settings'

export function CookieNotice() {
  const cookies = useSettings((state) => state.cookies)
  if (cookies !== 'unknown') return null

  return (
    <div className="fixed right-3 bottom-3 z-[1000] flex w-1/5 flex-col gap-3 border border-white/28 bg-black px-3 py-3 font-mono text-[12px] tracking-[0.08em] text-white/80">
      <p className="m-0">save settings in a cookie so they stay next visit.</p>
      <div className="flex gap-2">
        <button
          type="button"
          className="cursor-pointer border border-white/28 bg-transparent px-2 py-1 text-white/70"
          onClick={() => useSettings.getState().rejectCookies()}
        >
          reject
        </button>
        <button
          type="button"
          className="cursor-pointer border border-white/72 bg-transparent px-2 py-1 text-white"
          onClick={() => useSettings.getState().acceptCookies()}
        >
          accept
        </button>
      </div>
    </div>
  )
}
