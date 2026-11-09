import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { MainNetworkKey } from './main-network-key';
import { NetworkKeyService } from '../../../shared/services/network-key-service';
import { NetworkKeyResponse } from '../../../shared/models/network-key';
import { SuccessResponse } from '../../../shared/models/api_response';

describe('MainNetworkKey', () => {
  let component: MainNetworkKey;
  let fixture: ComponentFixture<MainNetworkKey>;
  let networkKeyServiceSpy: jasmine.SpyObj<NetworkKeyService>;
  let messageService: MessageService;

  const mockKey: NetworkKeyResponse = {
    id: '11111111-2222-3333-4444-555555555555',
    organizationId: 'org-123',
    networkKey: 'mrk_live_abcdef1234567890abcdef1234567890',
    name: 'Primary Network Key',
    isActive: true,
    createdAt: '2026-11-08T12:00:00',
  };

  const mockListResponse: SuccessResponse<NetworkKeyResponse[]> = {
    message: 'Success',
    success: true,
    response: 200,
    data: [mockKey],
  };

  beforeEach(async () => {
    networkKeyServiceSpy = jasmine.createSpyObj('NetworkKeyService', [
      'getActiveKeys',
      'generateNetworkKey',
      'deleteNetworkKey',
      'resolveNetworkKey',
    ]);
    networkKeyServiceSpy.getActiveKeys.and.returnValue(of(mockListResponse));

    await TestBed.configureTestingModule({
      imports: [MainNetworkKey],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        { provide: NetworkKeyService, useValue: networkKeyServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainNetworkKey);
    component = fixture.componentInstance;
    messageService = TestBed.inject(MessageService);
    spyOn(messageService, 'add');
    fixture.detectChanges();
  });

  it('should create and load active keys on init', () => {
    expect(component).toBeTruthy();
    expect(component.isLoading).toBeFalse();
    expect(component.keys.length).toBe(1);
    expect(component.keys[0]).toEqual(mockKey);
    expect(networkKeyServiceSpy.getActiveKeys).toHaveBeenCalled();
  });

  it('should toggle key visibility', () => {
    expect(component.isKeyVisible(mockKey.id)).toBeFalse();
    component.toggleKeyVisibility(mockKey.id);
    expect(component.isKeyVisible(mockKey.id)).toBeTrue();
    component.toggleKeyVisibility(mockKey.id);
    expect(component.isKeyVisible(mockKey.id)).toBeFalse();
  });

  it('should mask key when not visible', () => {
    const masked = component.getMaskedKey(mockKey.networkKey, false);
    expect(masked).toContain('••••••••••••••••');
    const unmasked = component.getMaskedKey(mockKey.networkKey, true);
    expect(unmasked).toBe(mockKey.networkKey);
  });

  it('should generate a new network key and add to list', () => {
    const newKey: NetworkKeyResponse = {
      id: '22222222-3333-4444-5555-666666666666',
      organizationId: 'org-123',
      networkKey: 'mrk_live_99999999999999999999999999999999',
      name: 'Secondary Key',
      isActive: true,
      createdAt: '2026-11-08T13:00:00',
    };

    networkKeyServiceSpy.generateNetworkKey.and.returnValue(
      of({
        message: 'Created',
        success: true,
        response: 201,
        data: newKey,
      })
    );

    component.newKeyName = 'Secondary Key';
    component.generateKey();

    expect(networkKeyServiceSpy.generateNetworkKey).toHaveBeenCalledWith({ name: 'Secondary Key' });
    expect(component.keys.length).toBe(2);
    expect(component.keys[0]).toEqual(newKey);
    expect(component.showCreateDialog).toBeFalse();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        severity: 'success',
        summary: 'Key Generated',
      })
    );
  });

  it('should revoke key upon confirmation and remove from list', () => {
    networkKeyServiceSpy.deleteNetworkKey.and.returnValue(
      of({
        message: 'Deleted',
        success: true,
        response: 200,
      })
    );

    component.openDeleteDialog(mockKey);
    expect(component.showDeleteDialog).toBeTrue();
    expect(component.selectedKeyToDelete).toEqual(mockKey);

    component.confirmDelete();

    expect(networkKeyServiceSpy.deleteNetworkKey).toHaveBeenCalledWith(mockKey.id);
    expect(component.keys.length).toBe(0);
    expect(component.showDeleteDialog).toBeFalse();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        severity: 'success',
        summary: 'Revoked',
      })
    );
  });
});
