// преобразует строковый таймстемп в таймстемп в секундах
// > getMs('34:23')
// < 2063
export function toSeconds(timeString: string): number {
  const dims = timeString.split(':').reverse();

  return dims
    .map((dim) => parseInt(dim))
    .reduce((acc, dim, index) => {
      return acc + dim * Math.pow(60, index);
    });
}
