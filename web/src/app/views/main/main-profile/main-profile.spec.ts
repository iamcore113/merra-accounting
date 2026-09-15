import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainProfile } from './main-profile';

describe('MainProfile', () => {
  let component: MainProfile;
  let fixture: ComponentFixture<MainProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
