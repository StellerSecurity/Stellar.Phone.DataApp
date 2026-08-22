import { Component, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-terms-and-conditions',
  templateUrl: './terms-and-conditions.component.html',
  styleUrls: ['./terms-and-conditions.component.scss'],
})
export class TermsAndConditionsComponent  implements OnInit {
  metaDescription:string = 'Share a onetime secret message and file with Stellar Secret. Protect your privacy and securely share confidential information.';
  metaTitle:string = 'Terms and Conditions - Stellar Secret';
  metaKeywords:string = 'Secret message generator, Secure message sharing, Encrypt personal information, Password protection, User data encryption, Private data sharing, Convert sensitive data';
  url: string = 'https://stellarsecret.io/';
  
  constructor() { }

  ngOnInit() {}

}
