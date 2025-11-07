/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CommonsService } from './commons.service';

describe('Service: Commons', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommonsService]
    });
  });

  it('should ...', inject([CommonsService], (service: CommonsService) => {
    expect(service).toBeTruthy();
  }));
});
