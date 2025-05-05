import { Message } from './Message';

export interface Chat {
  chatId: number;
  messageList?: Message[];
}
