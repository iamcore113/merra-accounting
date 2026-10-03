import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-organization-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './no-organization-page.html',
  styleUrl: './no-organization-page.scss',
})
export class NoOrganizationPage {}
