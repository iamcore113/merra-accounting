import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AlertComponent } from '../../../components/alert/alert.component';
import { SimpleCardComponent } from '../../../components/simple-card/simple-card.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'],
  imports: [
    AlertComponent,
    SimpleCardComponent,
    MatProgressBarModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SigninComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
