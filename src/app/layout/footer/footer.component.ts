import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  standalone: false,
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  currentYear = new Date().getFullYear();
  appVersion = environment.version;
  appName = environment.appName;

  constructor() { }

  ngOnInit(): void {}
}