import { TestBed } from '@angular/core/testing';

import { TokenCheckService } from './token-check-service';

describe('TokenCheckService', () => {
  let service: TokenCheckService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenCheckService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
