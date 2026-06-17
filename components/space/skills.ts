/* The 5 skill-planets along the flight path. `z` is the world-Z each planet
   sits at; the camera flies from z=12 to z=12-FLIGHT_Z, so it passes each in
   turn. `peak` is the flight-progress (0..1) at which the label reveals —
   tuned to the APPROACH window, when the planet is ~42 units ahead of the
   camera: large and dramatic but fully inside the FOV cone (not level with
   the camera, which would put it 90° off-screen). Sides alternate so planets
   sit off-centre, not blocking the path. Shared by Planets.tsx + the label
   overlay in Flythrough.tsx.

   Pacing (FLIGHT_Z=600, approach D=42):
     planet_z = -30 - 600*peak   →   label fires at D=42 ahead.
   Hero owns p<0.12; planets at 0.20/0.37/0.54/0.70/0.86; last clears by ~0.94
   leaving 0.94–1.0 for the content handoff. */
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
};

export const SKILLS: Skill[] = [
  { key: "engineering", label: "Engineering", desc: "AI · CFD · computer vision · robotics", tex: "/img/space/mars.jpg", z: -150, radius: 7, x: 9, y: 3.5, peak: 0.2 },
  { key: "trading", label: "Trading", desc: "Systematic FX & quant strategies", tex: "/img/space/jupiter.jpg", z: -252, radius: 9.5, x: -12, y: -3, peak: 0.37 },
  { key: "venture", label: "Venture", desc: "Founder — ventures built & shipped", tex: "/img/space/saturn.jpg", z: -354, radius: 8, x: 11, y: 4.5, peak: 0.54 },
  { key: "strategy", label: "Strategy", desc: "Growth, go-to-market, positioning", tex: "/img/space/neptune.jpg", z: -450, radius: 7.5, x: -10, y: 3, peak: 0.7 },
  { key: "research", label: "Research", desc: "NECTEC graphene · ISSDC NASA finalist", tex: "/img/space/earth.jpg", z: -546, radius: 8, x: 9, y: -4, peak: 0.86 },
];
