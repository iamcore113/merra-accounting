import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainContact } from './main-contact';

describe('MainContact', () => {
  let component: MainContact;
  let fixture: ComponentFixture<MainContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainContact],
    }).compileComponents();

    fixture = TestBed.createComponent(MainContact);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render at least 5 static contacts in the table', () => {
    expect(component.dataSource.data.length).toBeGreaterThanOrEqual(5);
  });
});
