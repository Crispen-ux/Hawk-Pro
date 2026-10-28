export function unsplash(id: string, width = 1000): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`;
}

export const IMAGES = {
  hero: "1561314105-e6ac04c2984a",
  speakerA: "1608538770329-65941f62f9f8",
  speakerB: "1653579657403-25b2695601d4",
  speakerC: "1613830689755-3f89b57a96fc",
  mesh: "1485211177140-aa3b17a0c7b6",
  box: "1612022630455-ad6e37084907",
  arrays: "1763420953483-86239ad9c206",
  wall: "1769461929909-90ad81432709",
  stack: "1769461929909-90ad81432709",
  mixer: "1679931942077-0be253938a30",
  mixerB: "1600152015632-77c2aa5565d5",
  repair: "1517420704952-d9f39e95b43e",
  solder: "1562941995-17dc31eaaf6d",
} as const;
