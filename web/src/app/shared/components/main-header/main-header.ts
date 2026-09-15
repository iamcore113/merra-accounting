import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-header',
  imports: [RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './main-header.html',
  styleUrl: './main-header.scss',
})
export class MainHeader {
  isMenuOpen = false;
  isInvoiceSubmenuOpen = false;
  @Output() readonly menuToggle = new EventEmitter<void>();

  onHamburgerClick(): void {
    this.menuToggle.emit();
  }

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (!this.isMenuOpen) {
      this.isInvoiceSubmenuOpen = false;
    }
  }

  toggleInvoiceSubmenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isInvoiceSubmenuOpen = !this.isInvoiceSubmenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.isInvoiceSubmenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }
}
