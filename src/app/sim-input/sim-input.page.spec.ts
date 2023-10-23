import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimInputPage } from './sim-input.page';

describe('SimInputPage', () => {
  let component: SimInputPage;
  let fixture: ComponentFixture<SimInputPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(SimInputPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
