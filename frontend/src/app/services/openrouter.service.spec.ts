import { TestBed } from '@angular/core/testing';

import { OpenrouterService } from './openrouter.service';

describe('OpenrouterService', () => {
  let service: OpenrouterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenrouterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
