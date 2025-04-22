import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DarkmodePage } from './darkmode.page';

describe('DarkmodePage', () => {
  let component: DarkmodePage;
  let fixture: ComponentFixture<DarkmodePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DarkmodePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
