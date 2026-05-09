import { Component, ElementRef, HostListener } from '@angular/core';
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

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
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
