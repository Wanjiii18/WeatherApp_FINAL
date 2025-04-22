import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OfflinemodePage } from './offlinemode.page';

describe('OfflinemodePage', () => {
  let component: OfflinemodePage;
  let fixture: ComponentFixture<OfflinemodePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OfflinemodePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
