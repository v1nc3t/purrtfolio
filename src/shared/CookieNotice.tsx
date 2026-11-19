import { useSettings } from './settings'

export function CookieNotice() {
  const cookies = useSettings((state) => state.cookies)
  if (cookies !== 'unknown') return null

  return (
    <section
      aria-label="cookies"
      data-focused="true"
      className="window-frame fixed right-3 bottom-3 z-[1000] w-1/5 min-w-60 font-ui text-[12px]"
    >
      <div className="window-shell flex flex-col">
        <header className="window-header flex items-center py-1.5">
          <span className="min-w-0 flex-1 truncate px-4">cookies</span>
        </header>
        <div className="window-body flex flex-col gap-4 bg-terminal-bg p-4 text-text">
          <p className="m-0">save settings in a cookie so they stay next visit.</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="retro-button"
              onClick={() => useSettings.getState().rejectCookies()}
            >
              reject
            </button>
            <button
              type="button"
              className="retro-button"
              onClick={() => useSettings.getState().acceptCookies()}
            >
              accept
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
