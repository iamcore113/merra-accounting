import { Component, inject } from '@angular/core';
import { SimpleCardComponent } from '../../components/simple-card/simple-card.component';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-orphan-account',
  imports: [SimpleCardComponent, MatButtonModule],
  templateUrl: './orphan-account.html',
  styleUrl: './orphan-account.css',
})
export class OrphanAccount {
  private _router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly userEmail: string = this.route.snapshot.params['email'] || '';

  goToOrganization() {
    this._router.navigate(['/account/organization/create/', this.userEmail]);
  }

}
