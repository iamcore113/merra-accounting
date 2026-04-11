import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-main-header',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './main-header.html',
  styleUrl: './main-header.scss',
})
export class MainHeader {

}
