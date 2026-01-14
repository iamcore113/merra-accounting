import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrphanAccount } from './orphan-account';

describe('OrphanAccount', () => {
  let component: OrphanAccount;
  let fixture: ComponentFixture<OrphanAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrphanAccount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrphanAccount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
