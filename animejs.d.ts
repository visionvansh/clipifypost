declare module 'animejs' {
  import { AnimeInstance, AnimeParams } from 'animejs';

  interface Anime {
    (params: AnimeParams): AnimeInstance;
    stagger: (value: number | number[], options?: { start?: number; from?: string | number }) => (number | number[])[];
  }

  const anime: Anime;
  export = anime;
}