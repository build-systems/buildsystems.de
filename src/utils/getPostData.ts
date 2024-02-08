import readingTime from 'reading-time'

type Post = {
  title: string
  file: string
  rawContent: () => string
}

export function formatDate(date: Date): string{
  const options: Intl.DateTimeFormatOptions = {year: 'numeric', month: 'long', day: 'numeric'};

  return new Date(date).toLocaleDateString(undefined, options);
}