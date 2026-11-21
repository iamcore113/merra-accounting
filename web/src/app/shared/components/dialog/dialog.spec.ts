import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { Dialog, DialogData } from './dialog';

describe('Dialog', () => {
  let component: Dialog;
  let fixture: ComponentFixture<Dialog>;
  let dialogRefSpy: jasmine.SpyObj<DynamicDialogRef>;

  const createWithData = (data: Partial<DialogData>) => {
    TestBed.resetTestingModule();
    dialogRefSpy = jasmine.createSpyObj('DynamicDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [Dialog],
      providers: [
        { provide: DynamicDialogRef, useValue: dialogRefSpy },
        { provide: DynamicDialogConfig, useValue: { data } },
      ],
    });

    fixture = TestBed.createComponent(Dialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    createWithData({
      title: 'Test Dialog',
      messages: ['Test message'],
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render sign out variant with context badge and highlights', () => {
    createWithData({
      variant: 'signout',
      subtitle: 'Session Security',
      title: 'Ready to sign out?',
      messages: ['Are you sure you want to end your session?'],
      contextBadge: {
        icon: 'pi pi-user',
        label: 'Signed in account',
        value: 'Jane Doe',
        subValue: 'jane@merra.com',
      },
      confirmLabel: 'Sign Out',
      cancelLabel: 'Stay Signed In',
      confirmColor: 'warn',
      icon: 'pi pi-sign-out',
    });

    const el: HTMLElement = fixture.nativeElement;
    expect(component.isSignOutVariant).toBeTrue();
    expect(el.querySelector('.dialog-signout')).toBeTruthy();
    expect(el.querySelector('.dialog-title')?.textContent).toContain('Ready to sign out?');
    expect(el.querySelector('.context-value')?.textContent).toContain('Jane Doe');
    expect(el.querySelector('.context-subvalue')?.textContent).toContain('jane@merra.com');
    expect(el.querySelectorAll('.highlight-item').length).toBe(2);
  });

  it('should close dialog with true on confirm and false on cancel', () => {
    component.cancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);

    component.confirm();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});

