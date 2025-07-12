import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  standalone: false,
  styleUrls: ['./auth-layout.component.css']
})
export class AuthLayoutComponent implements OnInit {

  currentYear = new Date().getFullYear();
  
  constructor() { }

  ngOnInit(): void {}
}