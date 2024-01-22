import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class DataServiceAPIService {

  private API_URL = "https://stellardatauiapiappprod.azurewebsites.net/api/";

    constructor(private httpClient: HttpClient) {};

  getOverview(sim_id: string) {
    return this.httpClient.get<any>(this.API_URL + "v1/overviewcontroller/view?id=" + sim_id);
  }

}
