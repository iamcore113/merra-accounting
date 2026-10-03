import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-sidenav',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, RouterModule],
  templateUrl: './main-sidenav.html',
  styleUrl: './main-sidenav.scss',
})
export class MainSidenav {
  @Input() isOpen = true;
  @Input() isMobile = false;
  @Output() readonly isOpenChange = new EventEmitter<boolean>();

  protected readonly navItems = [
    { label: 'Dashboard', route: '', icon: 'pi pi-th-large', iconBg: '#6FD1D7', iconColor: '#1A7A80' },
    { label: 'Accounts', route: '', icon: 'pi pi-wallet', iconBg: '#FF653F', iconColor: '#8C1A00' },
    { label: 'Personal details', route: 'profile', icon: 'pi pi-id-card', iconBg: '#9ED3DC', iconColor: '#1F6E78' },
    { label: 'Activity log', route: '', icon: 'pi pi-history', iconBg: '#C9BEFF', iconColor: '#4A3A8C' },
    { label: 'Settings', route: '', icon: 'pi pi-cog', iconBg: '#F08D39', iconColor: '#7A3D00' },
  ];

  toggleSidenav(): void {
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
  }
}
