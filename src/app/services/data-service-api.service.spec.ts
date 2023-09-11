import { TestBed } from '@angular/core/testing';

import { DataServiceAPIService } from './data-service-api.service';

describe('DataServiceAPIService', () => {
  let service: DataServiceAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataServiceAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
