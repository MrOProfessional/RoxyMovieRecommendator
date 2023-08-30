import { Configuration, OpenAIApi } from 'openai';
import { v4 as uuid } from 'uuid';
import { loadMainPrompt } from '../textInterpretationService/textInterpretationService.js';
import { cacheValue, getValueFromCache } from '../cacheService/cacheService.js';
import request from 'request';
import dotenv from 'dotenv';
import fs from 'fs'; 

dotenv.config();

export class GPTService {
  constructor() {
    this.configureService();
  }

  configureService() {
    const configuration = new Configuration({
      apiKey: process.env.OPEN_API_KEY,
    });
    this.openAi = new OpenAIApi(configuration);
  }

  async sendChatCompletion(messages) {
    try {
      const completion = await this.openAi.createChatCompletion({
        model: 'gpt-3.5-turbo-16k-0613',
        messages,
        temperature: 0,
        max_tokens: 500
      });
      return completion.data.choices[0].message;
    } catch (error) {
      return "i couldn't communicate with open ai :" + error
    }
  }

  async writeMessagesToFile(messages) {
    const filePath = 'messages.json'; // Specify the file path
    const jsonData = JSON.stringify(messages, null, 2); // Pretty print JSON data

    fs.writeFileSync(filePath, jsonData, 'utf8'); // Write JSON data to file
  }

  async createChatPrompt() {
    if (!this.openAi) return null;

    const mainPrompt = await loadMainPrompt();
    const startingMessageThread = [{ content: mainPrompt, role: 'user' }];
    const response = await this.sendChatCompletion(startingMessageThread);
    return this._createChatPromptResponse(response, startingMessageThread);
  }

  async _createChatPromptResponse(response, startingMessageThread) {
    const chatId = uuid();
    startingMessageThread.push(response);
    cacheValue(`chat-${chatId}`, startingMessageThread);
    return { chatId, message: response.content };
  }

  async processResponse(chatId, responseMessage, messageThread, callback, sendRequestBody) {
    messageThread.push(responseMessage);
    cacheValue(`chat-${chatId}`, messageThread);
  
    const httpRequestTag = '<http_request>';
    if (responseMessage && responseMessage.content && responseMessage.content.includes(httpRequestTag)) {
      await this._handleHttpRequests(chatId, responseMessage.content, callback, sendRequestBody);
    } else {
      callback(responseMessage.content);
    }
  }

  async _handleHttpRequests(chatId, message, callback, sendRequestBody) {
    const requestsJSON = this._extractHttpRequests(message);

    const messageWithoutCode = this._removeHttpRequestTags(message, requestsJSON);
    callback(messageWithoutCode);

    const responses = await this._performHttpRequests(requestsJSON);
    if (sendRequestBody) {
      sendRequestBody(requestsJSON.join(','));
    }
    console.log(responses);
    this.handleSessionMessage(chatId, `${responses.join('\n')}`, callback);
  }


  _extractHttpRequests(message) {
    const httpRequestStartTag = '<http_request>';
    const httpRequestEndTag = '</http_request>';
    return message
      .split(httpRequestStartTag)
      .filter((e) => e.includes(httpRequestEndTag))
      .map((e) => e.split(httpRequestEndTag)[0]);
  }

  _removeHttpRequestTags(message, requestsJSON) {
    let messageWithoutCode = message;
    for (const json of requestsJSON) {
      messageWithoutCode = messageWithoutCode.replace(json, '');
    }
    const httpRequestStartTag = '<http_request>';
    const httpRequestEndTag = '</http_request>';
    messageWithoutCode = messageWithoutCode.replace(
      new RegExp(httpRequestStartTag, 'g'),
      ''
    );
    messageWithoutCode = messageWithoutCode.replace(
      new RegExp(httpRequestEndTag, 'g'),
      ''
    );
    return messageWithoutCode;
  }

  async _performHttpRequests(requestsJSON) {
    try {
      const responses = await Promise.all(
        requestsJSON.map(async (requestJSON) => {
          const requestObject = JSON.parse(requestJSON);
          // request.requestObject.headers = {
          //   'X-RapidAPI-Key' : 
          // }
          console.log('Initiating request:', requestObject);
          return await this._performRequest(requestObject);
        })
      );
      return responses;
    } catch (error) {
      console.error('Error processing response:', error);
    }
  }

  async _performRequest(requestObject) {
    try {
      return new Promise((resolve, reject) => {
        request(
          {
            url: requestObject.url,
            qs: requestObject.query,
            method: requestObject.method,
            json: requestObject.body,
            headers: requestObject.headers
          },
          (error, response, body) => {
            if (error) {
              console.log(error);
              reject(error);
            } else {
              resolve(body);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error processing response:', error);
    }
  }

  async handleSessionMessage(chatId, message, callback, sendRequestBody) {
    const messageThread = await getValueFromCache(`chat-${chatId}`);
    messageThread.push({ content: message, role: 'user' });
  
    try {
      const responseMessage = await this.sendChatCompletion(messageThread);
  
      await this.processResponse(chatId, responseMessage, messageThread, callback, sendRequestBody);
    } catch (error) {
      console.error('Error sending chat completion:', error);
  
      setTimeout(() => {
        this.handleSessionMessage(chatId, message, callback, sendRequestBody);
      }, 4000);
    }
  }
  
}
