export type BlogFAQItem = {
  q: string;
  a: string;
};

export type BlogHeading = {
  id: string;
  level: 2 | 3;
  text: string;
};

export type BlogCTA = {
  title: string;
  text: string;
  buttonText: string;
  href: string;
};

export type BlogContentBlock =
  | { type: 'h2' | 'h3'; id: string; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'quote'; text: string; by?: string }
  | { type: 'code'; language?: string; code: string }
  | { type: 'cta'; cta: BlogCTA }
  | { type: 'faq'; items: BlogFAQItem[] }
  | { type: 'divider' };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags?: string[];
  dateISO: string; // e.g. 2025-12-29
  readingTime?: string; // e.g. 6 min
  coverImageUrl?: string;
  updatedISO?: string;
  headings?: BlogHeading[];
  blocks?: BlogContentBlock[];
  faq?: BlogFAQItem[];
};

export type BlogIndexEntry = Omit<BlogPost, 'blocks' | 'headings' | 'faq'>;

export type BlogQuery = {
  q?: string;
  category?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
};
