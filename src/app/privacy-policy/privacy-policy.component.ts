import { Component, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
})
export class PrivacyPolicyComponent  implements OnInit {
  metaDescription:string = 'Share a onetime secret message and file with Stellar Secret. Protect your privacy and securely share confidential information.';
  metaTitle:string = 'Privacy Policy - Stellar Secret';
  metaKeywords:string = 'Secret message generator, Secure message sharing, Encrypt personal information, Password protection, User data encryption, Private data sharing, Convert sensitive data';
  url: string = 'https://stellarsecret.io/';
  
  constructor() { }

  ngOnInit() {}

}
