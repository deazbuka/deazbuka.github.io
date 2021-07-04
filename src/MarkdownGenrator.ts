import { IRefinedData, IRefinedDataItem } from './autorefineVideoData';
import groupBy from 'lodash.groupby';
import alphabet from './alphabet.json';

interface IAzbukaContentItem {
  literal: string;
  items: IRefinedDataItem[];
}

export class MarkdownGenerator {
  playlistId: string;
  items: IRefinedDataItem[];

  constructor(refinedData: IRefinedData) {
    this.playlistId = refinedData.playlistId;
    this.items = refinedData.items;
  }

  generate(): string {
    const menu = this.makeMenu();
    const content = this.makeContent();
    const specials = this.makeSpecials();

    return `---
layout: main
---

# Азбука демократии

Рубрика «Азбука демократии» от неподражаемой [Екатерины Шульман](https://twitter.com/eschulmann)

${menu}

${content}
## Статусы без Азбуки
${specials}`;
  }

  makeMenu(): string {
    const literalsWithWords = new Set(
      this.itemsGroupedByLiterals().map(({ literal }) => literal)
    );

    return alphabet
      .map((literal) => {
        if (literalsWithWords.has(literal)) {
          return `[${literal.toUpperCase()}](#${literal})`;
        }
        return literal.toUpperCase();
      })
      .join(' ');
  }

  getLiterals() {
    const literals = this.items
      .filter((item) => item.word)
      .map((item) => item.word[0]);
    return Array.from(new Set(literals));
  }

  makeContent(): string {
    console.log(
      JSON.stringify(this.getLiterals()) ===
        JSON.stringify(
          this.itemsGroupedByLiterals().map(({ literal }) => literal)
        )
    );

    return this.itemsGroupedByLiterals()
      .map((block) => this.makeLiteralBlock(block))
      .join('\n');
  }

  makeLiteralBlock({ literal, items }: IAzbukaContentItem) {
    const content = items.map((item) => this.makeLine(item)).join('\n');
    return `### ${literal.toUpperCase()}\n${content}`;
  }

  makeSpecials(): string {
    const specials = this.items.filter((item) => !!item.text);

    return specials
      .map((special) => {
        const link = this.makeLink(special.videoId);
        return `- [${special.text}](${link})`;
      })
      .join('\n');
  }

  itemsGroupedByLiterals(): IAzbukaContentItem[] {
    const azbukaEpisodes = this.items.filter((item) => !!item.word);
    const result: IAzbukaContentItem[] = [];
    const grouped: Record<string, IRefinedDataItem[]> = groupBy(
      azbukaEpisodes,
      (episode: IRefinedDataItem) => this.firstLiteral(episode)
    );

    for (const [literal, items] of Object.entries(grouped)) {
      result.push({ literal: literal, items: items });
    }

    return result;
  }

  firstLiteral(item: IRefinedDataItem) {
    return item.word[0].toLowerCase();
  }

  makeLine(item: IRefinedDataItem): string {
    const link = this.makeLink(item.videoId, item.t);
    return `- [${item.word || item.text}](${link})`;
  }

  makeLink(videoId: string, t?: number): string {
    const timeSuffix = t ? `&t=${t}` : '';

    return `https://www.youtube.com/watch?v=${videoId}&list=${this.playlistId}${timeSuffix}`;
  }
}
