export interface ChatMessage {
id: string;
content: string;
fromUser: boolean;
createdAt: number;
}


export interface ChatRequest {
message: string;
}


export interface ChatResponse {
reply: string;
}