import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-main-profile',
  imports: [MatIconModule, MatButtonModule, RouterOutlet],
  templateUrl: './main-profile.html',
  styleUrls: ['./main-profile.scss'],
})
export class MainProfile {

}
