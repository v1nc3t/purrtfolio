import { CatPost, ClockPost, FullPost, HalfPost, SidePost, SliceLink } from './PaperPost'

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

const FIGURE_CAMERA = [
  '     _     ',
  ' _n_|_|_,_ ',
  '|===.-.===|',
  '|  ((_))  |',
  '`===`-`===`',
].join('\n')

const FIGURE_NYATCHING = [
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

export function ProjectsPage() {
  return (
    <div className="projects-page scrollbar-line h-full overflow-auto px-4 pt-8 pb-10">
      <header className="border-y border-[#a37c4f] py-8">
        <h1 className="sr-only">Purr Times</h1>
        <pre className="mx-auto m-0 w-fit font-mono text-[1.5em] leading-[1.08]">
          {MASTHEAD}
        </pre>
      </header>

      <p className="mt-6 mb-0 border-b border-[#a37c4f] pb-5 text-center leading-relaxed">
        <p>
          Welcome to my project archive, styled like a newspaper, designed with ASCII charaters, and themed around cats. Here you can find software, tools and side-projects I have either built or worked on.
        </p>
        <p>
          I did come across a cool website that inspired me for this design: {' '} <SliceLink href="https://eduardoboucas.com/">eduardoboucas.com</SliceLink>
        </p>
      </p>

      <div className="mt-6 grid grid-cols-[minmax(0,4fr)_minmax(0,1fr)] gap-x-4 gap-y-6">
        <section className="grid grid-cols-2 gap-x-4 gap-y-6 border-r border-[#a37c4f] pr-4">
          
          <FullPost
            title="Placed 4th in a robotics Hackathon"
            date='13 Sep 2026'
          >
            <p>
              With a some friends I took part in a robotics hackathon, 
              where we had to build a robot, from scratch, that can carry a small payload and drop it.
            </p>
            <p>
              With no background or knowledge in robotics, we build a robot, programmed it, and drove it to a close call onto the podium.
              I enjoyed it a lot, working together, designing, debugging, and building.    
            </p>
            <p>
              The competition consisted in driving the robot on a multi-story course made of wood, collecting miniture ducks from droppers and bringging them back to a box.
              I did feel a little sad not winnig, but because I had so mcuh fun that I didn't even mind.
            </p>
          </FullPost>

          <FullPost
            title="Watchlist for not forgetting shows"
            date="Summer 2026"
            figure={FIGURE_NYATCHING}
            image="right"
            links={
              <>
                <SliceLink href="https://chromewebstore.google.com/detail/nyatching-list/lfclngikmpcnhmgmakapkcmlpkbgjcna">chrome store</SliceLink>
                <SliceLink href="https://addons.mozilla.org/en-US/firefox/addon/nyatching-list/">firefox add-ons</SliceLink>
                <SliceLink href="https://github.com/v1nc3t/nyatching-list">github</SliceLink>
              </>
            }
          >
            <p>
              Have you ever stared to many TV shows and forget at which episode you are? 
              Have you finished a season and never got reminded a new season is out?
            </p>
            <p>
              Well this web extention fixes that exact problem. You can add a show directly from <SliceLink href="https://www.imdb.com/">IMDB</SliceLink> through the pop up,
              set your progress, and even get reminders about new seasons or episodes.
            </p>
          </FullPost>

          <HalfPost
            title="Build a CLI tool for manga"
            date='Spring 2026'
            links={
              <SliceLink href="https://github.com/v1nc3t/meowDFer">github</SliceLink>
            }
          >
            <p>
              I had a problem, whenever I downloaded manga, through legal means ;), they would come in compressed folders of chapters, having a .png with each page.
              So I wanted to automate the process of extracting and compiling into chapter PDFs. 
            </p>
            <p>
              I used python, since it was easy to use and had helpful libraries. 
              I did add some features along the way, such as a web scraper that finds the chapter ranges for volumes of the manga given a link from wikipedia or fandom.com.
              So the PDFs of chapters can be merged into volume PDFs.
            </p>

          </HalfPost>

          <HalfPost
            title="Participated in an AI Hackathon"
            date='2 May 2026'
          >
            <p>
              I was incouraged by a friend to participate in a hackathon. Wans't
              sure at first but I gave in, with the excuse of trying it at least
              once. The experience was not bad, but not writting a single line of
              code for 12h, prompting everything to an AI and sitting back took
              the fun out of it.
            </p>
            <p>
              Much of the day was spent sitting, talking and comming up with
              ideas. At a certain point I was feeling very bored, but I did get
              experience working in a team and free snacks :)
            </p>
          </HalfPost>
        </section>

        <aside className="flex flex-col gap-6">
          <ClockPost />
          <SidePost title="Photography" to="photos" figure={FIGURE_CAMERA}>
            here are some photos I have taken.
          </SidePost>
          <CatPost />
        </aside>
      </div>
    </div>
  )
}
