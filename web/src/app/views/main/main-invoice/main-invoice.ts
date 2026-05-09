import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-main-invoice',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './main-invoice.html',
  styleUrl: './main-invoice.scss',
})
export class MainInvoice {
  isSecondaryPanelOpen = false;

  openSecondaryPanel() {
    this.isSecondaryPanelOpen = true;
  }

  closeSecondaryPanel() {
    this.isSecondaryPanelOpen = false;
  }

  toggleSecondaryPanel() {
    this.isSecondaryPanelOpen = !this.isSecondaryPanelOpen;
  }
}
