import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfflinePage } from './offline-page';

describe('OfflinePage', () => {
  let component: OfflinePage;
  let fixture: ComponentFixture<OfflinePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfflinePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfflinePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
