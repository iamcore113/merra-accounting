import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-main-sidenav',
  standalone: true,
  imports: [MatListModule, MatIconModule, RouterLink],
  templateUrl: './main-sidenav.html',
  styleUrl: './main-sidenav.scss',
})
export class MainSidenav {}
