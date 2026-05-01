import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainOrganization } from './main-organization';

describe('MainOrganization', () => {
  let component: MainOrganization;
  let fixture: ComponentFixture<MainOrganization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainOrganization]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainOrganization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
