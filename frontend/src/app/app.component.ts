import { Component, OnInit } from '@angular/core';
// import { MatDialog } from '@angular/material/dialog';
import { ChatComponent as ChatComponent } from './components/chat/chat.component';
import { MatDialog } from '@angular/material/dialog'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'angular-openai';

  constructor(public dialog: MatDialog) { }
  ngOnInit(): void {
    this.openChat()
  }

  openChat() {
    this.dialog.open(ChatComponent, {
      width: '50vw',
      height: '70vw',
      maxWidth: '60vw',
      maxHeight: '60vh',
      panelClass: 'custom-dialog'
    });
  }
}
