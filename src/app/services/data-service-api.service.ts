import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class DataServiceAPIService {

  private API_URL = "https://stellardatauiapiappprod.azurewebsites.net/api/";

    constructor(private httpClient: HttpClient) {};

  getOverview(sim_id: string) {
    return this.httpClient.get<any>(this.API_URL + "v2/overviewcontroller/view?id=" + sim_id);
  }


  resolveTopupToken(token: string) {
    return this.httpClient.get<any>(this.API_URL + "v1/topupcontroller/resolve/" + encodeURIComponent(token));
  }

  createTopupCheckout(token: string, packageCode: string, plan: any = {}) {
    return this.httpClient.post<any>(this.API_URL + "v1/topupcontroller/checkout", {
      token: token,
      package_code: packageCode,
      plan: plan
    });
  }

}
