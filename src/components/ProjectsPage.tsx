import { FullPost, HalfPost, SidePost } from './PaperPost'

const PURR = [
  '______ _   _____________ ',
  '| ___ \\ | | | ___ \\ ___ \\',
  '| |_/ / | | | |_/ / |_/ /',
  '|  __/| | | |    /|    / ',
  '| |   | |_| | |\\ \\| |\\ \\ ',
  '\\_|    \\___/\\_| \\_\\_| \\_|',
]

const CAT = [
  '.-------------------.',
  '|                   |',
  '|             (`\\   |',
  '|   |\\__/`|    ) )  |',
  '|  _|o o  |_  / /   |',
  "'--(((---(((--------'",
]

const TIMES = [
  ' _____ ________  ___ _____ _____ ',
  '|_   _|_   _|  \\/  ||  ___/  ___|',
  '  | |   | | | .  . || |__ \\ `--. ',
  '  | |   | | | |\\/| ||  __| `--. \\',
  '  | |  _| |_| |  | || |___/\\__/ /',
  '  \\_/  \\___/\\_|  |_/\\____/\\____/ ',
]

const MASTHEAD = PURR.map((line, i) => `${line}  ${CAT[i]}  ${TIMES[i]}`).join('\n')

const FIGURE = ['  /\\_/\\  ', ' ( o.o ) ', '  > ^ <  '].join('\n')

/*
const FIGURE = [
' @@@@                           @@@@ ',
' @@@@@@@@                   @@@@@@@@ ',
' @@@   @@@@@             @@@@@   @@@ ',
' @@@      @@@@         @@@@      @@@ ',
' @@@   @@@@@@@@@@@@@@@@@@@@@@@@  @@@ ',
' @@@   @@:::::::::::::::::::@@@  @@@ ',
' @@@   @@:::::::::::::::::::@@@  @@@ ',
'      @@:::::::::::::::::::@@@     ',
'      @@::@@:@@@@@@@@@@@@::@@@     ',
'      @@:::::::::::::::::::@@@     ',
'      @@:::::::::::::::::::@@@     ',
'      @@::@@:@@@@@@@@@@@@::@@@     ',
'      @@:::::::::::::::::::@@@     ',
'      @@:::::::::::::::::::@@@     ',
'      @@::@@:@@@@@@@@@@@@::@@@     ',
'      @@:::::::::::::::::::@@@     ',
'      @@:::::::::::::::::::@@@     ',
'      @@:::::::::::::::::::@@@     ',
'      @@@@@@@@@@@@@@@@@@@@@@@@     ',
].join('\n')
*/

export function ProjectsPage() {
  return (
    <div className="projects-page scrollbar-line h-full overflow-auto px-4 pt-6 pb-8">
      <header className="border-y border-[#7a7164] py-6">
        <h1 className="sr-only">Purr Times</h1>
        <pre className="mx-auto m-0 w-fit font-mono text-[12px] leading-[13px]">
          {MASTHEAD}
        </pre>
      </header>

      <p className="mt-3 mb-0 border-b border-[#7a7164] pb-3 text-center text-[10px] leading-relaxed">
        A small page intro goes here. What this paper is, who it is for, why
        these projects exist.
      </p>

      <div className="mt-4 grid grid-cols-[minmax(0,4fr)_minmax(0,1fr)] gap-4">
        <section className="grid grid-cols-2 gap-4 border-r border-[#7a7164] pr-4">
          <FullPost
            title="Headline that shares the row with its figure"
            figure={FIGURE}
            image="left"
            links={[
              { href: 'https://github.com', label: 'github' },
              { href: 'https://example.com', label: 'demo' },
            ]}
          >
            Template copy sits beside the figure. Pass image="right" to flip
            them. Drop another FullPost in this section to add a story.
          </FullPost>

          <HalfPost
            title="Shorter dispatch, left"
            links={[{ href: 'https://github.com', label: 'github' }]}
          >
            Text only. Add figure and image="over" or image="under" when you
            want a picture.
          </HalfPost>

          <HalfPost
            title="Shorter dispatch, right"
            figure={FIGURE}
            image="under"
            links={[
              { href: 'https://github.com', label: 'source' },
              { href: 'https://example.com', label: 'live' },
            ]}
          >
            Half-width post with the figure under the copy.
          </HalfPost>
        </section>

        <aside>
          <SidePost title="See the photos" to="photos">
            Side panel post. Click to open another window. Swap this for a game
            or an internal jump later.
          </SidePost>
        </aside>
      </div>
    </div>
  )
}
