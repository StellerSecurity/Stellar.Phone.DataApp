import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewPage } from './view.page';
import { ViewPageModule } from './view.module';

describe('ViewPage', () => {
  let component: ViewPage;
  let fixture: ComponentFixture<ViewPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewPageModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
