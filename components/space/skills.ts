/* The 5 skill-planets along the flight path. `peak` is the flight-progress
   (0..1) at which the label reveals and the planet is ~APPROACH units ahead of
   the camera (large, fully framed). `z` is DERIVED from `peak` against the
   non-linear distance map (see phase.ts) so each planet stays framed at its
   beat regardless of the easing. Peaks are spread across the cruise segment
   (0.26–0.88); with FLIGHT_Z=1120 they land ~145u apart, so only one planet is
   ever in frame (no vanishing-point clump). `side` puts the DOM label on the
   OPPOSITE side from the planet. Shared by Planets.tsx + the label overlay. */
import { planetZ } from "./phase";

export type Skill = {
  key: string;
  label: string;
  desc: string;
  tex: string;
  z: number;
  radius: number;
  x: number;
  y: number;
  peak: number;
  glow: number; // self-illumination — higher for dim/low-contrast textures
  side: "left" | "right"; // DOM label side (opposite the planet)
};

export const SKILLS: Skill[] = [
  { key: "engineering", label: "Engineering", desc: "AI · CFD · computer vision · robotics", tex: "/img/space/mars.jpg", peak: 0.3, z: planetZ(0.3), radius: 7, x: 9, y: 3.5, glow: 0.36, side: "left" },
  { key: "trading", label: "Trading", desc: "Systematic FX & quant strategies", tex: "/img/space/jupiter.jpg", peak: 0.43, z: planetZ(0.43), radius: 9.5, x: -12, y: -3, glow: 0.32, side: "right" },
  { key: "venture", label: "Venture", desc: "Founder — ventures built & shipped", tex: "/img/space/saturn.jpg", peak: 0.56, z: planetZ(0.56), radius: 8, x: 11, y: 4.5, glow: 0.5, side: "left" },
  { key: "strategy", label: "Strategy", desc: "Growth, go-to-market, positioning", tex: "/img/space/neptune.jpg", peak: 0.69, z: planetZ(0.69), radius: 7.5, x: -10, y: 3, glow: 0.4, side: "right" },
  { key: "research", label: "Research", desc: "NECTEC graphene · ISSDC NASA finalist", tex: "/img/space/earth.jpg", peak: 0.82, z: planetZ(0.82), radius: 8, x: 9, y: -4, glow: 0.3, side: "left" },
];
