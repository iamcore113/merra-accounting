import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompleteOrganizationDetailsForm } from './complete-organization-details-form';

describe('CompleteOrganizationDetailsForm', () => {
  let component: CompleteOrganizationDetailsForm;
  let fixture: ComponentFixture<CompleteOrganizationDetailsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompleteOrganizationDetailsForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompleteOrganizationDetailsForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
