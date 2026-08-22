import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonButton, IonCol, IonContent, IonHeader, IonPopover, IonRow, IonTitle, IonToolbar } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { MetaTagsDirective } from '../../../directives/meta-tags.directive';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonCol,
    IonContent,
    IonHeader,
    IonPopover,
    IonRow,
    IonTitle,
    IonToolbar,
    TranslatePipe,
    MetaTagsDirective,
    RouterModule
  ],
})
export class HeaderComponent  implements OnInit {
  @Input() title!: string;
  @Input() description?: string;
  @Input() keywords?: string;
  @Input() url?: string;
  isPopoverOpen = false;
  popoverEvent: Event | undefined;

  constructor() { }

  ngOnInit() {}

  openPopover(event: MouseEvent) {
    this.popoverEvent = event;
    this.isPopoverOpen = true;
  }

}
