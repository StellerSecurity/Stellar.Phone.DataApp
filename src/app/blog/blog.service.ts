import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

export type BlogContentBlock =
    | { type: 'h1' | 'h2' | 'h3'; text: string }
    | { type: 'p'; text: string }
    | { type: 'quote'; text: string; by?: string }
    | { type: 'ul'; items: string[] }
    | { type: 'ol'; items: string[] }
    | { type: 'code'; lang?: string; text: string }
    | { type: 'callout'; title?: string; text: string }
    | { type: 'divider' }
    | { type: 'cta'; title: string; text: string; buttonText: string; href: string };


export type BlogPost = {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    tags?: string[];
    dateISO: string;
    readingTime: string;
    featured?: boolean;
    content?: BlogContentBlock[];
};

@Injectable({ providedIn: 'root' })
export class BlogService {
    private posts$ = this.http.get<BlogPost[]>('assets/blog/posts.json').pipe(
        map((data) => (Array.isArray(data) ? data : [])),
        shareReplay(1)
    );

    constructor(private http: HttpClient) {}

    private norm(v: string): string {
        try {
            return decodeURIComponent(String(v ?? '')).trim().toLowerCase();
        } catch {
            return String(v ?? '').trim().toLowerCase();
        }
    }

    getPosts(): Observable<BlogPost[]> {
        return this.posts$;
    }

    getPostBySlug(slug: string): Observable<BlogPost | null> {
        const needle = this.norm(slug);

        return this.posts$.pipe(
            map((posts) => posts.find((p) => this.norm(p.slug) === needle) ?? null)
        );
    }
}
