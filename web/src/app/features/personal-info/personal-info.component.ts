import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import { SimpleCardComponent } from '../../components/simple-card/simple-card.component';


interface Food {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-personal-info',
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.css'],
  imports: [MatFormFieldModule, MatSelectModule, MatButtonModule, MatInputModule, SimpleCardComponent],
})
export class PersonalInfoComponent implements OnInit {
  productId = signal<string>('');
  foods: Food[] = [
    {value: 'steak-0', viewValue: 'Steak'},
    {value: 'pizza-1', viewValue: 'Pizza'},
    {value: 'tacos-2', viewValue: 'Tacos'},
  ];

  constructor(private activatedRoute: ActivatedRoute) {
    this.activatedRoute.params.subscribe((params) => {
      this.productId.set(params['id']);
    });
  }

  ngOnInit() {
  }

}
