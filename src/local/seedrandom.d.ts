declare module 'seedrandom' {
  interface Prng {
    (): number
  }
  interface SeedRandom {
    (seed?: string): Prng
    alea(seed?: string): Prng
  }
  const seedrandom: SeedRandom
  export default seedrandom
}