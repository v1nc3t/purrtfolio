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
  "'--(((---(((--------'"
];

const TIMES = [
  ' _____ ________  ___ _____ _____ ',
  '|_   _|_   _|  \\/  ||  ___/  ___|',
  '  | |   | | | .  . || |__ \\ `--. ',
  '  | |   | | | |\\/| ||  __| `--. \\',
  '  | |  _| |_| |  | || |___/\\__/ /',
  '  \\_/  \\___/\\_|  |_/\\____/\\____/ ',
]

const MASTHEAD = PURR.map((line, i) => `${line}  ${CAT[i]}  ${TIMES[i]}`).join('\n')

export function ProjectsPage() {
  return (
    <div className="projects-page h-full overflow-auto px-8 pt-4">
      <header className="border-y-2 border-double border-[#7a7164] py-4">
        <h1 className="sr-only">Purr Times</h1>
        <pre className="mx-auto m-0 w-fit font-mono text-[12px] leading-[13px]">
          {MASTHEAD}
        </pre>
      </header>
    </div>
  )
}
