import { Component, ElementRef, EventEmitter, HostListener, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RouterModule } from '@angular/router';
import { OrganizationService } from '../../services/organization-service';

@Component({
  selector: 'app-main-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TooltipModule],
  templateUrl: './main-header.html',
  styleUrl: './main-header.scss',
})
export class MainHeader implements OnInit {
  private readonly organizationService = inject(OrganizationService);
  isMenuOpen = false;
  currentOrgName = 'Loading...';
  orgInitial = 'M';
  @Output() readonly menuToggle = new EventEmitter<void>();

  ngOnInit(): void {
    this.loadCurrentOrganization();
  }

  loadCurrentOrganization(): void {
    this.organizationService.getCurrentOrganization().subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          const orgData = res.data;
          const name = orgData.names?.displayName || orgData.displayName || orgData.name;
          if (name) {
            this.currentOrgName = name;
            this.orgInitial = name.charAt(0).toUpperCase();
          }
        }
      },
      error: () => {
        this.currentOrgName = 'My Organization';
        this.orgInitial = 'M';
      }
    });
  }

  onHamburgerClick(): void {
    this.menuToggle.emit();
  }

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }
}
