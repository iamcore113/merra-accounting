import { Component, OnInit, signal } from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [MatInputModule, ReactiveFormsModule, MatFormFieldModule, FormsModule],
})
export class LoginComponent implements OnInit {
  readonly email = new FormControl('', [Validators.required, Validators.email]);

  updateErrorMessage() {
    if (this.email.hasError('required')) {
      this.errorMessage.set('You must enter a value');
    } else if (this.email.hasError('email')) {
      this.errorMessage.set('Not a valid email');
    } else {
      this.errorMessage.set('');
    }
  }

  errorMessage = signal('');
  constructor() { }

  ngOnInit() {
  }

}
