import { Component, OnInit } from '@angular/core';
import { Card, RequestCard, ResponseCard } from 'src/app/models';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'cbs-itinerary',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  input: string = '';
  cards: Card[] = [];
  response: any;
  constructor(private socket: Socket) {}

  ngOnInit(): void {
    this.socket.on('response-message', (message: string) => {
      const respose = new ResponseCard();
      respose.responses = [message.trim()];
      if(respose != null) {
        this.response = respose.responses;
        console.log(this.response);
      }

      const lastCard =this.cards[this.cards.length-1];
      if(lastCard instanceof RequestCard){
        lastCard.status='done';
      }
      this.cards.push(respose);
    });

    this.socket.on('relayed-request-body', (message:string)=>{
      console.log(message);
    })
  }

  showSpinner(card: Card): boolean {
    if (card instanceof RequestCard) {
      if (card.status === 'waiting') {
        return true;
      }
    }

    return false;
  }

  onAsk(): void {
    if (!this.input) {
      return;
    }

    const reqCard = new RequestCard();
    reqCard.prompt = this.input;
    reqCard.status = 'waiting';

    this.cards.push(reqCard);
    this.socket.emit('chat-message', this.input);


    this.input = '';
  }
}
