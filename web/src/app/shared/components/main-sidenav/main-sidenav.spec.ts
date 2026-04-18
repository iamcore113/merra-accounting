import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainSidenav } from './main-sidenav';

describe('MainSidenav', () => {
  let component: MainSidenav;
  let fixture: ComponentFixture<MainSidenav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainSidenav]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainSidenav);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
