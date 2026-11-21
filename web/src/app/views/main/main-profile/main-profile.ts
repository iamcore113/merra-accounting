import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, ViewEncapsulation, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AccordionModule } from 'primeng/accordion';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Dialog, DialogData } from '../../../shared/components/dialog/dialog';
import { UserService } from '../../../shared/services/user-service';
import { LocalStorageService } from '../../../shared/services/local-storage-service';
import { PrincipalDetailsResponse } from '../../../shared/models/organization';
import { RestCountriesSelection, Config } from '../../../shared/models/api_response';
import { VerifiedAccountResponse } from '../../../shared/models/auth';
import { OrganizationService } from '../../../shared/services/organization-service';
import { UtilityService } from '../../../shared/services/utility-service';
import { AuthService } from '../../../shared/services/auth-service';

@Component({
  selector: 'app-profile-image-dialog',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <section class="profile-image-dialog">
      <div class="profile-image-placeholder">
        <i class="pi pi-user profile-image-icon"></i>
      </div>
      <div class="dialog-actions-row">
        <p-button label="Close" [size]="'small'" [outlined]="true" (click)="close()"></p-button>
        <p-button label="Upload Photo" [size]="'small'"></p-button>
      </div>
    </section>
  `,
  styles: [`
    .profile-image-dialog {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .profile-image-placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1.5rem 0;
    }
    .profile-image-icon {
      font-size: 4rem;
      color: #94B4C1;
    }
    .dialog-actions-row {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `]
})
export class ProfileImageDialog {
  private readonly dialogRef = inject(DynamicDialogRef);

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [ButtonModule, PasswordModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="change-password-dialog">
      <p class="sheet-description">Set a new password for your account.</p>

      <div class="field-wrapper">
        <label class="field-label">Current password</label>
        <p-password [(ngModel)]="currentPassword" [feedback]="false" [toggleMask]="true" [size]="'small'" styleClass="full-width" [inputStyleClass]="'full-width'" placeholder="Enter current password"></p-password>
      </div>

      <div class="field-wrapper">
        <label class="field-label">New password</label>
        <p-password [(ngModel)]="newPassword" [toggleMask]="true" [size]="'small'" styleClass="full-width" [inputStyleClass]="'full-width'" placeholder="Enter new password"></p-password>
      </div>

      <div class="field-wrapper">
        <label class="field-label">Confirm new password</label>
        <p-password [(ngModel)]="confirmPassword" [feedback]="false" [toggleMask]="true" [size]="'small'" styleClass="full-width" [inputStyleClass]="'full-width'" placeholder="Re-enter new password"></p-password>
      </div>

      <p class="sheet-note">
        Once you change your password, you will be automatically logged out.<br>
        You will also receive an email with instructions on how to sign in again using your new password.
      </p>

      <div class="dialog-actions-row">
        <p-button label="Cancel" [outlined]="true" [size]="'small'" (click)="close()"></p-button>
        <p-button label="Update Password" severity="danger" [size]="'small'" (click)="close()"></p-button>
      </div>
    </section>
  `,
  styles: [`
    .change-password-dialog {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .sheet-description {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
    }
    .field-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .field-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #475569;
    }
    .sheet-note {
      margin: 0.5rem 0 0;
      font-size: 0.8rem;
      line-height: 1.45;
      color: #64748b;
    }
    .dialog-actions-row {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class ChangePasswordDialog {
  private readonly dialogRef = inject(DynamicDialogRef);
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-main-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AccordionModule,
    AutoCompleteModule,
    SelectModule,
    BadgeModule,
    ChipModule,
    ButtonModule,
    InputTextModule,
    SkeletonModule,
    DialogModule,
    TooltipModule
  ],
  templateUrl: './main-profile.html',
  styleUrl: './main-profile.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MainProfile implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly dialogService = inject(DialogService);
  private readonly messageService = inject(MessageService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly organizationService = inject(OrganizationService);
  private readonly utilityService = inject(UtilityService);
  private readonly fb = inject(FormBuilder);

  @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef<HTMLInputElement>>;

  public personalDetails: PrincipalDetailsResponse | null = null;
  affiliatedOrganizationsCount = 0;
  isLoading = true;
  isUpdating = false;
  isEditingEmail = false;
  isEditingCountry = false;
  isEditingName = false;
  isEditingGender = false;
  countries: RestCountriesSelection = [];
  filteredCountries: string[] = [];

  activeSection: 'personal' | 'settings' = 'personal';
  customProfileImageUrl: string | null = null;
  isUploadingProfileImage = false;
  isRemovingProfileImage = false;
  isLoadingProfileImage = false;
  isProfileImageLoaded = false;
  isDraggingProfileImage = false;
  private previousProfileImageUrl: string | null = null;

  // Interactive Profile Photo Editor (Move/Pan, Zoom/Crop, Rotate, Flip)
  showImageEditorDialog = false;
  editorImageUrl: string | null = null;
  editorFileName = 'profile-photo.png';
  editorFileType = 'image/png';
  editorZoom = 1;
  editorRotation = 0;
  editorFlipX = false;
  editorFlipY = false;
  editorPanX = 0;
  editorPanY = 0;
  isDraggingEditorCanvas = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragInitialPanX = 0;
  private dragInitialPanY = 0;
  private editorNaturalWidth = 0;
  private editorNaturalHeight = 0;

  hasSentActivationPin = signal(false);
  pinDigits = signal<string[]>(['', '', '', '']);
  pinError = signal<string | null>(null);
  isActivatingPin = signal(false);
  isResendingPin = signal(false);
  resendCooldownSeconds = signal(0);
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  get isAccountActivated(): boolean {
    if (this.personalDetails && typeof this.personalDetails.isEnabled === 'boolean') {
      return this.personalDetails.isEnabled;
    }
    return !this.userService.isAccountUnverified();
  }

  get isPinComplete(): boolean {
    return this.pinDigits().every((d) => /^\d$/.test(d));
  }

  genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' }
  ];

  profileForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    gender: ['', Validators.required],
    country: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  get countryControl(): FormControl {
    return this.profileForm.get('country') as FormControl;
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadCountries();
    this.loadStoredProfileImage();
    this.userService.getAuthenticatedUserDetails().subscribe({
      next: (response: any) => {
        this.personalDetails = response.data as PrincipalDetailsResponse;
        if (this.personalDetails?.organizationAffiliation) {
          this.affiliatedOrganizationsCount = this.personalDetails.organizationAffiliation.count || (this.personalDetails.organizationAffiliation.organizations?.length ?? 0);
        }
        const enabled = this.personalDetails?.isEnabled ?? this.personalDetails?.enabled;
        if (typeof enabled === 'boolean') {
          this.userService.setAccountUnverified(!enabled);
        }
        this.patchForm(this.personalDetails);
        this.isLoading = false;
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Failed to fetch user details:', error);
        this.isLoading = false;
        this.cdRef.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    this.revokeProfileImageUrl();
    this.revokeEditorImageUrl();
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }

  private loadStoredProfileImage(): void {
    if (!this.userService.getProfileImage) {
      return;
    }
    this.isLoadingProfileImage = true;
    this.userService.getProfileImage().subscribe({
      next: (blob: Blob) => {
        this.setProfileImageFromBlob(blob);
        this.isLoadingProfileImage = false;
        this.cdRef.detectChanges();
      },
      error: () => {
        // 404 means no profile image has been uploaded yet
        this.customProfileImageUrl = null;
        this.isLoadingProfileImage = false;
        this.cdRef.detectChanges();
      },
    });
  }

  private setProfileImageFromBlob(blob: Blob): void {
    this.revokeProfileImageUrl();
    this.isProfileImageLoaded = false;
    this.customProfileImageUrl = URL.createObjectURL(blob);
    this.cdRef.detectChanges();
  }

  private revokeProfileImageUrl(): void {
    if (this.customProfileImageUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.customProfileImageUrl);
    }
  }

  getUserInitials(): string {
    const fullName = this.personalDetails?.fullName?.trim();
    if (fullName) {
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    const email = this.personalDetails?.email?.trim();
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'ME';
  }

  onProfileFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      this.openImageEditorWithFile(file);
    }
  }

  openProfileImagePicker(input: HTMLInputElement): void {
    if (this.isUploadingProfileImage || this.isRemovingProfileImage || this.isLoadingProfileImage) {
      return;
    }
    input.click();
  }

  onProfileImageDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.isUploadingProfileImage) {
      this.isDraggingProfileImage = true;
    }
  }

  onProfileImageDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingProfileImage = false;
  }

  onProfileImageDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingProfileImage = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && !this.isUploadingProfileImage) {
      this.openImageEditorWithFile(file);
    }
  }

  private validateProfileImageFile(file: File): boolean {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Unsupported File',
        detail: 'Profile image must be a PNG, JPEG or WEBP image',
      });
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn',
        summary: 'File Too Large',
        detail: `Profile image must be smaller than 5MB (selected: ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      });
      return false;
    }
    return true;
  }

  openImageEditorWithFile(file: File): void {
    if (!this.validateProfileImageFile(file)) {
      return;
    }
    this.revokeEditorImageUrl();
    this.editorFileName = file.name || 'profile-photo.png';
    this.editorFileType = file.type || 'image/png';
    this.editorImageUrl = URL.createObjectURL(file);
    this.resetImageEditorTransforms();
    this.showImageEditorDialog = true;
    this.cdRef.detectChanges();
  }

  openExistingImageEditor(): void {
    if (!this.customProfileImageUrl || this.isUploadingProfileImage || this.isRemovingProfileImage) {
      return;
    }
    this.revokeEditorImageUrl();
    this.editorFileName = 'profile-photo.png';
    this.editorFileType = 'image/png';
    this.editorImageUrl = this.customProfileImageUrl;
    this.resetImageEditorTransforms();
    this.showImageEditorDialog = true;
    this.cdRef.detectChanges();
  }

  closeImageEditorDialog(): void {
    this.showImageEditorDialog = false;
    this.isDraggingEditorCanvas = false;
    this.revokeEditorImageUrl();
    this.cdRef.detectChanges();
  }

  private revokeEditorImageUrl(): void {
    if (
      this.editorImageUrl &&
      this.editorImageUrl.startsWith('blob:') &&
      this.editorImageUrl !== this.customProfileImageUrl
    ) {
      URL.revokeObjectURL(this.editorImageUrl);
    }
    this.editorImageUrl = null;
  }

  resetImageEditorTransforms(): void {
    this.editorZoom = 1;
    this.editorRotation = 0;
    this.editorFlipX = false;
    this.editorFlipY = false;
    this.editorPanX = 0;
    this.editorPanY = 0;
  }

  onEditorImageLoaded(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.editorNaturalWidth = img.naturalWidth || 512;
    this.editorNaturalHeight = img.naturalHeight || 512;
  }

  getEditorTransformStyle(): string {
    const scaleX = (this.editorFlipX ? -1 : 1) * this.editorZoom;
    const scaleY = (this.editorFlipY ? -1 : 1) * this.editorZoom;
    return `translate3d(${this.editorPanX}px, ${this.editorPanY}px, 0) rotate(${this.editorRotation}deg) scale(${scaleX}, ${scaleY})`;
  }

  onEditorPointerDown(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.isDraggingEditorCanvas = true;
    const pt = this.getPointerCoordinates(event);
    this.dragStartX = pt.x;
    this.dragStartY = pt.y;
    this.dragInitialPanX = this.editorPanX;
    this.dragInitialPanY = this.editorPanY;
  }

  onEditorPointerMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDraggingEditorCanvas) {
      return;
    }
    event.preventDefault();
    const pt = this.getPointerCoordinates(event);
    this.editorPanX = Math.round(this.dragInitialPanX + (pt.x - this.dragStartX));
    this.editorPanY = Math.round(this.dragInitialPanY + (pt.y - this.dragStartY));
  }

  onEditorPointerUp(): void {
    this.isDraggingEditorCanvas = false;
  }

  onEditorWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    this.adjustEditorZoom(delta);
  }

  private getPointerCoordinates(event: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('touches' in event && event.touches.length > 0) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    const mouse = event as MouseEvent;
    return { x: mouse.clientX, y: mouse.clientY };
  }

  adjustEditorZoom(delta: number): void {
    const next = Math.min(3, Math.max(0.5, +(this.editorZoom + delta).toFixed(2)));
    this.editorZoom = next;
  }

  rotateEditorImage(degreesDelta: number): void {
    let next = this.editorRotation + degreesDelta;
    while (next > 180) next -= 360;
    while (next < -180) next += 360;
    this.editorRotation = next;
  }

  toggleEditorFlipX(): void {
    this.editorFlipX = !this.editorFlipX;
  }

  toggleEditorFlipY(): void {
    this.editorFlipY = !this.editorFlipY;
  }

  nudgeEditorPosition(dx: number, dy: number): void {
    this.editorPanX += dx;
    this.editorPanY += dy;
  }

  centerEditorPosition(): void {
    this.editorPanX = 0;
    this.editorPanY = 0;
  }

  async applyCropAndUpload(): Promise<void> {
    if (!this.editorImageUrl) {
      return;
    }
    try {
      const croppedFile = await this.renderEditedImageToFile();
      this.closeImageEditorDialog();
      this.uploadProfileImage(croppedFile);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Image Processing Failed',
        detail: 'Could not process the edited image. Please try again.',
      });
    }
  }

  private renderEditedImageToFile(): Promise<File> {
    return new Promise((resolve, reject) => {
      if (!this.editorImageUrl) {
        reject(new Error('No editor image source'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const outputSize = 512;
        const viewportSize = 260;
        const ratio = outputSize / viewportSize;

        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        const natW = img.naturalWidth || outputSize;
        const natH = img.naturalHeight || outputSize;
        // Fit image initially so it covers the viewport (object-fit: cover behavior)
        const baseScale = Math.max(outputSize / natW, outputSize / natH);
        const drawW = natW * baseScale;
        const drawH = natH * baseScale;

        ctx.save();
        ctx.translate(
          outputSize / 2 + this.editorPanX * ratio,
          outputSize / 2 + this.editorPanY * ratio
        );
        ctx.rotate((this.editorRotation * Math.PI) / 180);
        ctx.scale(
          (this.editorFlipX ? -1 : 1) * this.editorZoom,
          (this.editorFlipY ? -1 : 1) * this.editorZoom
        );
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        const mimeType = ['image/png', 'image/jpeg', 'image/webp'].includes(this.editorFileType)
          ? this.editorFileType
          : 'image/png';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }
            const file = new File([blob], this.editorFileName || 'profile-photo.png', {
              type: mimeType,
            });
            resolve(file);
          },
          mimeType,
          0.92
        );
      };
      img.onerror = () => reject(new Error('Failed to load image for cropping'));
      img.src = this.editorImageUrl;
    });
  }

  uploadProfileImage(file: File): void {
    if (!this.validateProfileImageFile(file)) {
      return;
    }

    this.previousProfileImageUrl = this.customProfileImageUrl;
    this.customProfileImageUrl = URL.createObjectURL(file);
    this.isProfileImageLoaded = true;
    this.isUploadingProfileImage = true;
    this.cdRef.detectChanges();

    this.userService.uploadProfileImage(file).subscribe({
      next: () => {
        if (this.previousProfileImageUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(this.previousProfileImageUrl);
        }
        this.previousProfileImageUrl = null;
        this.isUploadingProfileImage = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Profile Photo Updated',
          detail: 'Your profile image has been updated',
          life: 2500,
        });
        this.cdRef.detectChanges();
      },
      error: () => {
        this.revokeProfileImageUrl();
        this.customProfileImageUrl = this.previousProfileImageUrl;
        this.previousProfileImageUrl = null;
        this.isUploadingProfileImage = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: 'Could not upload your profile image. Please try again.',
        });
        this.cdRef.detectChanges();
      },
    });
  }

  onProfileImageLoaded(): void {
    this.isProfileImageLoaded = true;
    this.cdRef.detectChanges();
  }

  removeProfileImage(): void {
    if (this.isRemovingProfileImage || this.isUploadingProfileImage) {
      return;
    }
    this.isRemovingProfileImage = true;
    this.userService.deleteProfileImage().subscribe({
      next: () => {
        this.isRemovingProfileImage = false;
        this.revokeProfileImageUrl();
        this.customProfileImageUrl = null;
        this.messageService.add({
          severity: 'info',
          summary: 'Profile Photo Removed',
          detail: 'Reverted to default profile avatar',
          life: 2000,
        });
        this.cdRef.detectChanges();
      },
      error: () => {
        this.isRemovingProfileImage = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Remove Failed',
          detail: 'Could not remove your profile image',
        });
        this.cdRef.detectChanges();
      },
    });
  }

  switchSection(section: 'personal' | 'settings'): void {
    this.activeSection = section;
    this.cdRef.detectChanges();
  }

  onPinDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value.replace(/\D/g, '');
    this.pinError.set(null);

    if (!rawValue) {
      this.updatePinDigit(index, '');
      input.value = '';
      return;
    }

    const digit = rawValue.slice(-1);
    this.updatePinDigit(index, digit);
    input.value = digit;

    if (index < 3) {
      this.focusPinInput(index + 1);
    }
  }

  onPinKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      this.pinError.set(null);
      const currentDigits = this.pinDigits();
      if (currentDigits[index]) {
        this.updatePinDigit(index, '');
      } else if (index > 0) {
        this.updatePinDigit(index - 1, '');
        this.focusPinInput(index - 1);
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusPinInput(index - 1);
      event.preventDefault();
    } else if (event.key === 'ArrowRight' && index < 3) {
      this.focusPinInput(index + 1);
      event.preventDefault();
    } else if (event.key === 'Enter' && this.isPinComplete) {
      this.activateAccountWithPin();
      event.preventDefault();
    }
  }

  onPinPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    this.applyPastedPin(pastedText);
  }

  async pastePinFromClipboard(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      this.applyPastedPin(text);
    } catch {
      this.messageService.add({
        severity: 'info',
        summary: 'Paste PIN',
        detail: 'Press Ctrl+V (or Cmd+V) inside the PIN boxes to paste your 4-digit code.',
        life: 3500,
      });
    }
  }

  private applyPastedPin(rawText: string): void {
    const digitsOnly = (rawText || '').replace(/\D/g, '').slice(0, 4);
    if (!digitsOnly) {
      return;
    }
    this.pinError.set(null);
    const updated = [...this.pinDigits()];
    for (let i = 0; i < 4; i++) {
      updated[i] = digitsOnly[i] || '';
    }
    this.pinDigits.set(updated);

    const inputs = this.pinInputs?.toArray() || [];
    inputs.forEach((el, idx) => {
      el.nativeElement.value = updated[idx];
    });
    this.focusPinInput(Math.min(digitsOnly.length, 3));
    this.cdRef.detectChanges();
  }

  activateAccountWithPin(): void {
    const email = this.personalDetails?.email || this.localStorage.getItem('user_email') || '';
    if (!email) {
      this.pinError.set('Unable to determine your account email address.');
      return;
    }

    const pin = this.pinDigits().join('');
    if (!/^\d{4}$/.test(pin)) {
      this.pinError.set('Please enter the 4-digit PIN code sent to your email.');
      return;
    }

    if (this.isActivatingPin()) {
      return;
    }

    this.isActivatingPin.set(true);
    this.pinError.set(null);

    this.authService
      .verifyPin({ email, pin })
      .pipe(
        finalize(() => {
          this.isActivatingPin.set(false);
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (response: Config) => {
          if (response.success && 'data' in response) {
            const verifiedData = (response as any).data as VerifiedAccountResponse;
            if (verifiedData?.accessToken) {
              this.localStorage.setItem('access_token', verifiedData.accessToken);
            }
          }

          if (this.personalDetails) {
            this.personalDetails = {
              ...this.personalDetails,
              isEnabled: true,
              enabled: true,
            };
          }
          this.userService.setAccountUnverified(false);

          this.messageService.add({
            severity: 'success',
            summary: 'Account Activated',
            detail: 'Your MERRA user account has been verified and activated successfully!',
            life: 5000,
          });
          this.cdRef.detectChanges();
        },
        error: (error) => {
          const msg =
            error?.error?.message ||
            error?.error?.error ||
            error?.message ||
            'Invalid or expired PIN code. Please check your email and try again.';
          this.pinError.set(msg);
          this.messageService.add({
            severity: 'error',
            summary: 'Activation Failed',
            detail: msg,
            life: 5000,
          });
          this.cdRef.detectChanges();
        },
      });
  }

  resendActivationPin(): void {
    const email = this.personalDetails?.email || this.localStorage.getItem('user_email') || '';
    if (!email || this.isResendingPin() || this.resendCooldownSeconds() > 0) {
      return;
    }

    const isFirstSend = !this.hasSentActivationPin();
    this.isResendingPin.set(true);
    this.authService
      .resendVerificationEmail({
        email,
        ...(this.personalDetails?.id ? { userId: this.personalDetails.id } : {}),
      })
      .pipe(
        finalize(() => {
          this.isResendingPin.set(false);
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.hasSentActivationPin.set(true);
          setTimeout(() => {
            this.clearPinBoxes();
            this.cdRef.detectChanges();
          }, 50);
          this.messageService.add({
            severity: 'success',
            summary: 'PIN Code Sent',
            detail: `A 4-digit activation PIN has been sent to ${email}.`,
            life: 5000,
          });
          if (!isFirstSend) {
            this.startResendCooldown(60);
          } else {
            this.startResendCooldown(30);
          }
        },
        error: (error) => {
          const msg =
            error?.error?.message ||
            error?.message ||
            'Failed to send activation PIN. Please try again.';
          this.messageService.add({
            severity: 'error',
            summary: 'Send Failed',
            detail: msg,
            life: 5000,
          });
        },
      });
  }

  private updatePinDigit(index: number, value: string): void {
    const updated = [...this.pinDigits()];
    updated[index] = value;
    this.pinDigits.set(updated);
  }

  private clearPinBoxes(): void {
    this.pinDigits.set(['', '', '', '']);
    this.pinError.set(null);
    const inputs = this.pinInputs?.toArray() || [];
    inputs.forEach((el) => {
      el.nativeElement.value = '';
    });
    this.focusPinInput(0);
  }

  private focusPinInput(index: number): void {
    const inputs = this.pinInputs?.toArray() || [];
    const target = inputs[index]?.nativeElement;
    if (target) {
      target.focus();
      target.select();
    }
  }

  private startResendCooldown(seconds: number): void {
    this.resendCooldownSeconds.set(seconds);
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
    this.cooldownInterval = setInterval(() => {
      this.resendCooldownSeconds.update((s) => {
        if (s <= 1) {
          if (this.cooldownInterval) {
            clearInterval(this.cooldownInterval);
            this.cooldownInterval = null;
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  private patchForm(details: PrincipalDetailsResponse | null): void {
    if (!details) return;
    this.profileForm.patchValue({
      firstName: details.firstName ?? '',
      lastName: details.lastName ?? '',
      gender: details.gender?.toLowerCase() ?? '',
      country: details.country ?? '',
      email: details.email ?? '',
    }, { emitEvent: false });
    this.profileForm.markAsPristine();
  }

  updateProfile(): void {
    if (this.profileForm.invalid || this.profileForm.pristine) return;
    const value = this.profileForm.getRawValue();
    const payload: PrincipalDetailsResponse = {
      ...this.personalDetails!,
      firstName: value.firstName,
      lastName: value.lastName,
      gender: value.gender,
      country: value.country,
      email: value.email,
    };
    this.isUpdating = true;
    this.userService.updateProfile(payload).subscribe({
      next: (response: any) => {
        this.personalDetails = response.data as PrincipalDetailsResponse;
        this.patchForm(this.personalDetails);
        this.isUpdating = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully', life: 3000 });
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Failed to update profile:', error);
        this.isUpdating = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile', life: 5000 });
        this.cdRef.detectChanges();
      },
    });
  }

  searchCountry(event: any): void {
    const query = (event.query || '').toLowerCase().trim();
    if (!query) {
      this.filteredCountries = this.countries.map(c => c.name);
    } else {
      this.filteredCountries = this.countries
        .filter(c => (c.name && c.name.toLowerCase().includes(query)) || (c.cca2 && c.cca2.toLowerCase().includes(query)))
        .map(c => c.name);
    }
  }

  private loadCountries(): void {
    this.utilityService.getCountries().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response && Array.isArray(response.data)) {
          const countryList = response.data as any[];
          this.countries = countryList
            .map(c => ({
              name: c.countryName || c.common || c.official || c.name || '',
              cca2: c.isoAlpha2Code || c.alpha2 || c.cca2 || '',
              currency: c.code || c.symbol || 'N/A'
            }))
            .filter(c => !!c.name && !!c.cca2)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          this.cdRef.detectChanges();
        }
      },
      error: (error) => {
        console.error('Failed to load countries:', error);
      }
    });
  }

  openProfileImageDialog(): void {
    this.dialogService.open(ProfileImageDialog, {
      header: 'Profile Picture',
      width: '380px'
    });
  }

  openEmailChangeDialog(): void {
    const data: DialogData = {
      title: 'Change Email Address',
      messages: [
        'Changing your email address will log you out of your account.',
        'You will need to sign in again using your new email address to continue.',
        'Note: You can only change your email address once every 2 months.',
      ],
      confirmLabel: 'Proceed',
    };
    const dialogRef = this.dialogService.open(Dialog, { data, header: 'Change Email Address', width: '420px' });
    dialogRef?.onClose.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.updateProfile();
        this.isEditingEmail = false;
      }
    });
  }

  openChangePasswordSheet(): void {
    this.dialogService.open(ChangePasswordDialog, {
      header: 'Change Password',
      width: '420px'
    });
  }

  onLogout(): void {
    const ref = this.dialogService.open(Dialog, {
      header: 'Confirm Sign Out',
      width: '420px',
      modal: true,
      data: {
        title: 'Sign Out',
        messages: ['Are you sure you want to sign out of your account?'],
        confirmLabel: 'Sign Out',
        cancelLabel: 'Cancel',
        confirmColor: 'warn',
        icon: 'pi pi-sign-out',
      },
    });

    if (ref) {
      ref.onClose.subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.authService.logout().subscribe();
        }
      });
    }
  }

  getGenderDisplay(): string {
    const g = this.personalDetails?.gender?.toLowerCase();
    if (g === 'm' || g === 'male') return 'Male';
    if (g === 'f' || g === 'female') return 'Female';
    return this.personalDetails?.gender || 'Not set';
  }

  getCountryDisplay(): string {
    const code = this.personalDetails?.country;
    if (!code) return 'Not set';
    const found = this.countries.find(
      c => c.cca2?.toLowerCase() === code.toLowerCase() || c.name?.toLowerCase() === code.toLowerCase()
    );
    return found ? `${found.name} (${found.cca2})` : code;
  }
}
