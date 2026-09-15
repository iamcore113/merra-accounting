import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoOrganizationPage } from './no-organization-page';

describe('NoOrganizationPage', () => {
  let component: NoOrganizationPage;
  let fixture: ComponentFixture<NoOrganizationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoOrganizationPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoOrganizationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
