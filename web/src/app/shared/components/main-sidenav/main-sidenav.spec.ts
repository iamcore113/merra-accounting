import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DialogService } from 'primeng/dynamicdialog';

import { MainSidenav } from './main-sidenav';
import { AuthService } from '../../services/auth-service';

describe('MainSidenav', () => {
  let component: MainSidenav;
  let fixture: ComponentFixture<MainSidenav>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let dialogServiceSpy: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    dialogServiceSpy = jasmine.createSpyObj('DialogService', ['open']);

    await TestBed.configureTestingModule({
      imports: [MainSidenav],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: DialogService, useValue: dialogServiceSpy },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainSidenav);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open confirmation dialog on logout click', () => {
    dialogServiceSpy.open.and.returnValue({
      onClose: { subscribe: jasmine.createSpy('subscribe') }
    } as any);

    component.onLogout();
    expect(dialogServiceSpy.open).toHaveBeenCalled();
  });
});
