import { useEffect, useState } from 'react'

const TABS = ['about me', 'history', 'structure', 'links', 'settings'] as const

const AVATAR = `                   
                                  ....:-===============-:....
                             .. -============================-...
                          ..======================================.
                       .==============================================.
                    .===================================================-..
                 ..========================================================..
                :============================================================:
              .================================================================..
            .====================================================================.
          .=======================================================================-.
          ==========================================================================.
       ..===============================-............-===============================.
      .:=============================:..................:=============================-.
      -============================........................============================-
    .:============================..........................============================:.
    .===========================-............................-===========================..
   .============================..............................============================.
   ============================................................============================
 ..============================................................============================.
 .============================-................................-============================
 .============================-................................-============================..
 :=============================................................=============================:
.==============================................................==============================
.===============================..............................===============================
 ================================............................================================.
.=================================..........................=================================
 ===================================......................===================================
.=====================================..................=====================================.
.=========================================.........:-========================================.
 :==========================================================================================:.
  ==========================================================================================
 .=====================================...............:==-==================================
   ===============================..........................===============================
   -===========================................................-===========================.
   .========================:....................................:========================.
     =====================:........................................:=====================.
     :===================............................................-==================:
      -================................................................================-..
       :==============..................................................==============-
       ..============....................................................============..
        . ==========......................................................-=========.
          .-=======........................................................========.
           ..=====-........................................................-=====..
             ..==-..........................................................===:.
              ..:-..........................................................=:.
                  ............................................................
                     ....................................................
                       ...............................................
                           .........................................
                             .................................. .
                                       .................
`

type Tab = (typeof TABS)[number]

export function AboutPage() {
  const [tab, setTab] = useState<Tab>('history')
  const [nameOpen, setNameOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)

  useEffect(() => {
    if (!nameOpen) return
    const id = window.setTimeout(() => setNameOpen(false), 3000)
    return () => window.clearTimeout(id)
  }, [nameOpen])

  useEffect(() => {
    if (!emailOpen) return
    const id = window.setTimeout(() => setEmailOpen(false), 3000)
    return () => window.clearTimeout(id)
  }, [emailOpen])

  return (
    <div className="flex h-full min-h-0 font-mono text-[clamp(0.75rem,1.3cqi,0.875rem)]">
      <aside className="scrollbar-line flex w-[clamp(11rem,34cqi,18rem)] shrink-0 flex-col gap-3 overflow-auto border-r border-white/16 p-3">
        <div aria-hidden className="@container w-full shrink-0">
          <pre
            className="m-0 mx-auto w-fit font-mono leading-[1.05] text-white/75"
            style={{ fontSize: 'calc(100cqw / 58)' }}
          >
            {AVATAR}
          </pre>
        </div>
        <div className="flex flex-col gap-2">
          <Line label="username" value="v1nc3nt" />
          <Secret
            label="name"
            hidden="^!#a7.K-g30&)3 C;o3[#~"
            shown="that is"
            open={nameOpen}
            onToggle={() => setNameOpen((open) => !open)}
          />
          <Secret
            label="email"
            hidden="?3o%h3.6x$p@mo;l.<0m"
            shown="private"
            open={emailOpen}
            onToggle={() => setEmailOpen((open) => !open)}
          />
          <Line label="year" value="2006" />
          <Line label="nationality" value="romanian/indian" />
          <div>
            <p className="m-0 text-white/45">hobbies:</p>
            <ul className="m-0 list-none p-0 text-white">
              {['building software', 'photography', 'cooking', 'music'].map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div role="tablist" aria-label="about" className="flex shrink-0 border-b border-white/16">
          {TABS.map((id) => {
            const selected = tab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`about-tab-${id}`}
                aria-controls={`about-panel-${id}`}
                aria-selected={selected}
                onClick={() => setTab(id)}
                className={`cursor-pointer border-r border-white/16 px-3 py-2 tracking-[0.14em] ${
                  selected ? 'text-white' : 'text-white/40'
                }`}
              >
                {id}
              </button>
            )
          })}
        </div>
        <div
          role="tabpanel"
          id={`about-panel-${tab}`}
          aria-labelledby={`about-tab-${tab}`}
          className="min-h-0 flex-1"
        />
      </section>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="m-0">
      <span className="text-white/45">{label}: </span>
      <span className="text-white">{value}</span>
    </p>
  )
}

function Secret({
  label,
  hidden,
  shown,
  open,
  onToggle,
}: {
  label: string
  hidden: string
  shown: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-baseline gap-2">
      <Line label={label} value={open ? shown : hidden} />
      <button
        type="button"
        aria-label={`${open ? 'hide' : 'show'} ${label}`}
        aria-pressed={open}
        onClick={onToggle}
        className="ml-auto shrink-0 cursor-pointer text-white/80"
      >
        <Eye open={open} />
      </button>
    </div>
  )
}

function Eye({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-[1em] w-[1.15em]" aria-hidden>
      <path
        d="M1.2 8S3.6 4 8 4s6.8 4 6.8 4-2.4 4-6.8 4S1.2 8 1.2 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="8" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      {open ? null : (
        <path d="M3 13.2 13 2.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
      )}
    </svg>
  )
}
