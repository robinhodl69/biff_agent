import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Button from "../components/Button";

export default function Home() {
  return (
    <Layout centered={true}>
      {/* SVG grain filter applied to h1 via filter: url() */}
      <svg style={{ display: "none" }}>
        <defs>
          <filter id="grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
              result="noiseOut"
            />
            <feColorMatrix
              in="noiseOut"
              type="saturate"
              values="0"
              result="grayNoise"
            />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended" />
            <feComposite in="blended" in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
      </svg>

      <div className="flex flex-col items-center text-center w-full">
        <h1
          className="text-primary font-bold tracking-[0.2em] leading-none mb-4"
          style={{
            fontSize: "clamp(5rem, 18vw, 10rem)",
            fontFamily: "'IBM Plex Serif', serif",
            filter: "url(#grain)",
          }}
        >
          BIFF
        </h1>

        <p className="text-text-muted text-[10px] md:text-sm uppercase tracking-[0.5em] mb-16">
          Autonomous Finance on Base
        </p>

        <div className="flex flex-row items-center justify-center gap-10 md:gap-14">
          <Link to="/tracking">
            <Button variant="minimal" size="none" className="text-sm md:text-lg">
              TRACK
            </Button>
          </Link>

          <Link to="/how-it-works">
            <Button variant="minimal" size="none" className="text-sm md:text-lg">
              DOCS
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
