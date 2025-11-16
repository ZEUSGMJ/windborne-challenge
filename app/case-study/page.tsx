import Link from 'next/link';
import { Highlight, themes } from 'prism-react-renderer';
import { Navbar } from '@/components/Navbar';

interface HighlightedCodeProps {
  code: string;
  language?: string;
}

function HighlightedCode({ code, language = 'typescript' }: HighlightedCodeProps) {
  return (
    <Highlight
      theme={themes.nightOwl}
      code={code.trim()}
      language={language}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 text-xs leading-relaxed`}
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

const speedCode = `
const timeDiffHours = previous.hourAgo - latest.hourAgo;

if (timeDiffHours <= 0) {
  // Skip invalid or reversed samples
  return null;
}

// Haversine distance between positions in km
const distanceKm = haversine(
  previous.lat,
  previous.lon,
  latest.lat,
  latest.lon
);

// Speed in km/h using the real time delta
const speedKmh = distanceKm / timeDiffHours;
`;

const discontinuityCode = `
let lonDiff = Math.abs(sample.lon - prevSample.lon);
const latDiff = Math.abs(sample.lat - prevSample.lat);

// Correct for International Date Line crossing
if (lonDiff > 180) {
  lonDiff = 360 - lonDiff;
}

const isJump = lonDiff > 15 || latDiff > 10;
const hourGap = Math.abs(sample.hourAgo - prevSample.hourAgo);
const hasMissingData = hourGap > 1;

if (isJump || hasMissingData) {
  // Close current segment and start a new one
  if (currentSegment.length > 1) {
    pathSegments.push(currentSegment);
  }
  currentSegment = [point];
} else {
  currentSegment.push(point);
}
`;

export default function CaseStudyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 lg:flex-row lg:py-16">
        {/* Left: main narrative */}
        <article className="w-full lg:w-3/4">
          <header className="mb-8 border-b border-zinc-800 pb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              WindBorne Systems • Engineering Challenge
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">
              Case Study: Visualizing a Live Global Balloon Constellation
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              This page documents how I approached the WindBorne Junior Web Developer
              challenge, from exploring the undocumented API to building a combined
              visualization that layers balloon telemetry with external weather data.
            </p>
          </header>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-zinc-50">
              Understanding the problem and data
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              I started by reading through the public material on the WindBorne site,
              especially the{' '}
              <Link
                href="https://windbornesystems.com/products/observations"
                className="font-medium text-sky-500 hover:text-sky-300"
                target="_blank"
              >
                Observations
              </Link>{' '}
              page and the API entry point at{' '}
              <Link
                href="https://api.windbornesystems.com/"
                className="font-medium text-sky-500 hover:text-sky-300"
                target="_blank"
              >
                api.windbornesystems.com
              </Link>
              . From there I queried the live constellation endpoints{' '}
              <code className="rounded bg-zinc-900/70 px-1.5 py-0.5 font-mono text-xs text-green-500">
                00.json
              </code>{' '}
              through{' '}
              <code className="rounded bg-zinc-900/70 px-1.5 py-0.5 font-mono text-xs text-green-500">
                23.json
              </code>{' '}
              to understand the shape of the data.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              Each file returned an array of 1000 objects that include at least latitude,
              longitude, and altitude in kilometers. By following a fixed array index across
              multiple hours, I observed that positions change smoothly and form realistic
              tracks. Based on that behavior I inferred that index{' '}
              <code className="rounded bg-zinc-900/70 px-1.5 py-0.5 font-mono text-xs text-green-500">
                i
              </code>{' '}
              in each file refers to the same balloon over time, even though this is not
              explicitly documented.
            </p>
          </section>

          {/* Section 2 - external API */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-zinc-50">
              Choosing an external data source
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              For the second dataset I selected the{' '}
              <Link
                href="https://open-meteo.com/"
                className="font-medium text-sky-500 hover:text-sky-300"
                target="_blank"
              >
                Open-Meteo
              </Link>{' '}
              weather API. I already use Open-Meteo on my personal site to drive
              location-based weather widgets, so I am familiar with its response formats and
              rate limits. It also provides global, free atmospheric data, which fits
              naturally with WindBorne&apos;s mission of dense global observations.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              For selected balloon positions I query Open-Meteo for local conditions such as
              wind speed and direction. This allows the interface to compare the observed
              motion of a balloon with the modelled state of the atmosphere at the same place
              and time.
            </p>
          </section>

          {/* Section 3 - first 2D version */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-zinc-50">
              First iteration: 2D map with per-balloon details
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              The first version of the app used a 2D map built with{' '}
              <code className="rounded bg-zinc-900/70 px-1.5 py-0.5 font-mono text-xs text-green-500">
                react-leaflet
              </code>
              . I chose Leaflet because I have used it before and it gives a fast path to put
              1000 markers on a map with interactive clustering and custom marker styling.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              The layout consists of two panes. The left pane shows the constellation view
              with all current balloon positions rendered as clustered markers. The right pane
              initially remains empty, then turns into a details panel once a balloon is
              selected. For a selected balloon the details panel shows:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-zinc-300">
              <li>Current latitude, longitude, and altitude</li>
              <li>Altitude history across the last 24 hours</li>
              <li>Estimated speed history derived from hourly positions</li>
              <li>A time slider that allows scrubbing along the track</li>
              <li>Overlaid Open-Meteo data such as wind speed at the balloon position</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              At this stage I also hit a common mapping issue: paths that cross the
              International Date Line would sometimes be drawn as long straight lines across
              the map. I fixed this later as part of a more general discontinuity detection
              pass.
            </p>
          </section>

          {/* Section 4 - Global stats panel */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-zinc-50">
              Global statistics and constellation-level insights
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              An empty details panel when no balloon was selected felt wasteful, so I turned
              it into a global statistics view when there is no active selection. This view is
              powered by a small statistics hook that processes the latest snapshot of all
              balloons and feeds a few Recharts-based components:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-zinc-300">
              <li>
                An altitude distribution histogram with bins such as 5–15 km, 15–25 km, and
                25–35 km.
              </li>
              <li>
                A geographic distribution chart that groups balloons by region and shows
                regional counts.
              </li>
              <li>
                A scatter plot of altitude versus estimated speed. For this chart I use a
                deterministic sample of up to 100 balloons instead of all 1000 to keep the
                plot readable and reduce overdraw.
              </li>
              <li>
                A key insights panel that surfaces maximum recorded speed, jet stream activity,
                region with the highest balloon concentration, and average altitude and speed.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              The sampling for the scatter plot is intentionally deterministic. I select evenly
              spaced entries from the sorted balloon list, rather than using randomness, so
              that the chart remains stable across renders and is easier to compare after
              refreshes.
            </p>
          </section>

          {/* Section 5 - speed calculation fix */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-zinc-50">
              Correcting speed estimation with irregular samples
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              My first attempt at speed estimation assumed that consecutive samples were
              exactly one hour apart. With missing or irregular data that assumption broke
              down and sometimes produced unrealistic speeds above 300 km per hour.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              The fix was to use the actual time difference between samples. Each sample
              contains an{' '}
              <code className="rounded bg-zinc-900/70 px-1.5 py-0.5 font-mono text-xs text-green-500">
                hourAgo
              </code>{' '}
              value. Instead of dividing by a hard-coded 1 hour, I compute the real delta and
              skip invalid pairs:
            </p>

            <div className="mt-4 space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Speed calculation sketch
              </p>
              <HighlightedCode code={speedCode} language="typescript" />
              <p className="text-xs text-zinc-400">
                This removed the extreme spikes while still keeping sensitivity to genuine
                rapid motion.
              </p>
            </div>
          </section>

          {/* Section 6 - trajectory discontinuities */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-zinc-50">
              Handling trajectory discontinuities and Date Line crossings
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              A second issue appeared in the trajectory visualization: some paths were drawn as
              straight lines that crossed the entire globe. This usually happened when the
              track crossed the International Date Line or when missing data caused the
              renderer to connect points that should not have been joined.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              To address this I implemented discontinuity detection for both the 2D map and the
              3D globe. For each consecutive pair of samples I compute absolute longitude and
              latitude differences, correct for International Date Line wrapping, and check for
              data gaps:
            </p>

            <div className="mt-4 space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Discontinuity detection sketch
              </p>
              <HighlightedCode code={discontinuityCode} language="typescript" />
              <p className="text-xs text-zinc-400">
                Only segments with at least two points are rendered. Instead of one long path
                with unrealistic lines, the user sees multiple realistic segments with gaps
                where the data is discontinuous. The International Date Line correction ensures
                that a balloon crossing from 179° to -179° longitude is properly recognized as
                a 2° movement rather than a 358° jump.
              </p>
            </div>
          </section>

          {/* Section 7 - 3D globe */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-zinc-50">
              Upgrading to a 3D globe with altitude visualization
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              The flat map worked, but it did not fully convey that this is a truly global
              system. I replaced the 2D map with{' '}
              <code className="rounded bg-zinc-900/70 px-1.5 py-0.5 font-mono text-xs text-green-500">
                react-globe.gl
              </code>{' '}
              to render a 3D Earth. Each balloon is drawn as a small sphere positioned at its
              latitude and longitude, with a vertical arc whose height scales with altitude.
              This produces a clear visual sense of where balloons sit relative to each other
              in the atmosphere.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              When a balloon is selected, its 24-hour trajectory appears as a path wrapped
              around the globe. I also add hourly markers along the path. Each marker displays
              a small HTML label such as{' '}
              <code className="rounded bg-zinc-900/70 px-1.5 py-0.5 font-mono text-xs text-green-500">
                7.4 km
              </code>{' '}
              or{' '}
              <code className="rounded bg-zinc-900/70 px-1.5 py-0.5 font-mono text-xs text-green-500">
                11.5 km
              </code>
              , which makes it easy to see how the balloon climbs and descends over time.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              Because 3D rendering can be expensive on weaker hardware, I kept the original
              Leaflet implementation and added a mode toggle. Users can switch between a 2D
              and 3D view without losing state. I also wired the Escape key to quickly clear a
              current selection, which made exploring many tracks much smoother.
            </p>
          </section>

          {/* Section 8 - data quality */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-zinc-50">
              Data quality diagnostics
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              While exploring the tracks I noticed balloons that remained at very low
              altitudes, others that jumped large distances in a single step, and some with
              missing hourly samples. Some of this may be valid behavior, but it is useful to
              surface as potential issues, so I built two complementary data quality panels.
            </p>

            <h3 className="mt-6 text-base font-semibold text-zinc-100">
              Global data quality view
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              The global statistics view includes a data quality panel that scans all 1000
              balloons and flags issues across the entire constellation. The quality checks
              currently flag:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-zinc-300">
              <li>Balloons that operate below 5 km for extended periods.</li>
              <li>Position jumps that exceed realistic latitude or longitude changes.</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              Each finding is categorized as either a warning or an error. The panel shows the
              top 20 issues by default with a{' '}
              <span className="rounded bg-zinc-900/70 px-1.5 py-0.5 font-mono text-xs text-sky-500">
                Load more
              </span>{' '}
              action that reveals 20 additional rows at a time. A{' '}
              <span className="rounded bg-zinc-900/70 px-1.5 py-0.5 font-mono text-xs text-sky-500">
                Show less
              </span>{' '}
              button resets to the initial view. Filter toggles for{' '}
              <span className="font-mono text-xs text-amber-500">&quot;Hide warnings&quot;</span>{' '}
              and{' '}
              <span className="font-mono text-xs text-amber-500">&quot;Hide errors&quot;</span>{' '}
              help focus on the most relevant issues.
            </p>

            <h3 className="mt-6 text-base font-semibold text-zinc-100">
              Per-balloon diagnostics
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              When a balloon is selected, a separate data quality panel appears in the details
              view that runs checks specific to that single balloon. This panel is more
              comprehensive than the global view and includes:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-zinc-300">
              <li>Incomplete data detection (fewer than 24 hourly samples).</li>
              <li>Missing hours in the sequence (gaps in the trajectory).</li>
              <li>
                Unusual altitude readings outside the typical stratospheric range (below 5 km
                or above 40 km).
              </li>
              <li>
                Position jumps with two severity levels: large jumps that are suspicious, and
                unrealistic teleportation-like jumps that are almost certainly errors.
              </li>
              <li>Stationary balloons that show no movement across multiple samples.</li>
              <li>
                Very stable altitude (less than 0.5 km variation), which may indicate a sensor
                issue.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              If all checks pass, the panel displays a green confirmation message. Otherwise,
              each issue is listed with an icon indicating its severity. This allows quick
              assessment of whether a particular balloon track is reliable for analysis.
            </p>
          </section>

          {/* Section 9 - closing */}
          <section className="mb-4 border-t border-zinc-800 pt-6">
            <h2 className="text-xl font-semibold text-zinc-50">Closing thoughts</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              This project was a good fit for how I like to work: start by understanding the
              data and constraints, ship an initial version quickly, then iterate to improve
              accuracy, robustness, and user experience. I enjoyed combining WindBorne&apos;s
              live telemetry with Open-Meteo data and building a tool that makes the
              constellation feel tangible rather than abstract JSON.
            </p>
          </section>
        </article>

        {/* Right: meta info */}
        <aside className="w-full space-y-6 lg:w-1/4 lg:border-l lg:border-zinc-800 lg:pl-6">
          <section className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
            <h3 className="text-sm font-semibold text-zinc-100">Project summary</h3>
            <dl className="mt-3 space-y-2 text-xs text-zinc-300">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Role</dt>
                <dd className="text-right">Junior Web Developer challenge</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Stack</dt>
                <dd className="text-right">
                  Next.js, TypeScript, Tailwind CSS, Leaflet, react-globe.gl, Recharts
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">APIs</dt>
                <dd className="text-right">
                  WindBorne treasure endpoints, Open-Meteo weather API
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
            <h3 className="text-sm font-semibold text-zinc-100">
              Why I am good to work with
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-300">
              I enjoy taking vague or underspecified systems, making them understandable, and
              turning them into something that is both technically sound and easy for other
              people to work with. I communicate clearly, document my decisions, and treat
              visual polish, performance, and data correctness as parts of the same problem
              rather than separate concerns.
            </p>
          </section>
        </aside>
        </div>
      </main>
    </div>
  );
}
