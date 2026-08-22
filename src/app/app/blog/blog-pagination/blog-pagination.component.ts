import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-blog-pagination',
  templateUrl: './blog-pagination.component.html',
  styleUrls: ['./blog-pagination.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
})
export class BlogPaginationComponent {
  @Input() page = 1;
  @Input() pageSize = 12;
  @Input() total = 0;

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    const p = Math.ceil(this.total / Math.max(1, this.pageSize));
    return Math.max(1, p);
  }

  get canPrev(): boolean {
    return this.page > 1;
  }

  get canNext(): boolean {
    return this.page < this.totalPages;
  }

  pages(): number[] {
    const total = this.totalPages;
    const current = this.page;
    const window = 2;
    const start = Math.max(1, current - window);
    const end = Math.min(total, current + window);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }

  go(p: number) {
    const next = Math.min(this.totalPages, Math.max(1, p));
    if (next !== this.page) this.pageChange.emit(next);
  }
}
