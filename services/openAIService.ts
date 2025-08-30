export interface RealtimeEvent {
  type: string;
  [key: string]: any;
}

export interface SessionConfig {
  instructions?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  input_audio_format?: "pcm16" | "g711_ulaw" | "g711_alaw";
  output_audio_format?: "pcm16" | "g711_ulaw" | "g711_alaw";
  input_audio_transcription?: {
    model: "whisper-1";
  };
  turn_detection?: {
    type: "server_vad";
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
  tools?: any[];
  tool_choice?: "auto" | "none" | string;
  temperature?: number;
  max_response_output_tokens?: number;
}

export interface OpenAIRealtimeService {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTextMessage: (text: string) => void;
  cancelResponse: () => void;
  updateSession: (config: SessionConfig) => void;
  isConnected: () => boolean;
  on: (eventType: string, callback: Function) => void;
  off: (eventType: string, callback: Function) => void;
  sendEvent: (event: RealtimeEvent) => void;
}

export const createOpenAIRealtimeService = (
  apiKey: string
): OpenAIRealtimeService => {
  let ws: WebSocket | null = null;
  const model = "gpt-4o-realtime-preview";
  const url = `wss://api.openai.com/v1/realtime?model=${model}`;
  const eventHandlers = new Map<string, Function[]>();

  const emit = (eventType: string, ...args: any[]): void => {
    const handlers = eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  };

  const handleServerEvent = (event: RealtimeEvent): void => {
    if (event.type === "error") {
      console.error("OpenAI API Error:", event.error);
    }

    switch (event.type) {
      case "session.created":
        emit("session.created", event.session);
        break;
      case "session.updated":
        emit("session.updated", event.session);
        break;
      case "conversation.item.created":
        emit("conversation.item.created", event.item);
        break;
      case "response.created":
        emit("response.created", event.response);
        break;
      case "response.output_item.added":
        console.log("Output item added:", event.item);
        emit("response.output_item.added", event.item);
        break;
      case "response.content_part.added":
        console.log("Content part added:", event.part);
        emit("response.content_part.added", event.part);
        break;
      case "response.text.delta":
        emit("response.text.delta", event.delta, event.item_id);
        break;
      case "response.text.done":
        emit("response.text.done", event.text, event.item_id);
        break;
      case "response.output_audio_transcript.delta":
        emit(
          "response.output_audio_transcript.delta",
          event.delta,
          event.item_id
        );
        break;
      case "response.output_audio_transcript.done":
        emit(
          "response.output_audio_transcript.done",
          event.transcript,
          event.item_id
        );
        break;
      case "response.done":
        emit("response.done", event.response);
        break;
      case "error":
        emit("error", event.error);
        break;
      default:
        emit("unknown_event", event);
        break;
    }
  };

  const connect = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        ws = new WebSocket(url, [
          "realtime",
          `openai-insecure-api-key.${apiKey}`,
        ]);

        ws.onopen = () => {
          emit("connected");
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleServerEvent(data);
          } catch (error) {
            console.error("Error parsing server event:", error);
          }
        };

        ws.onclose = (event) => {
          console.log(
            "Disconnected from OpenAI Realtime API:",
            event.code,
            event.reason
          );
          emit("disconnected", { code: event.code, reason: event.reason });
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          emit("error", error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  };

  const sendEvent = (event: RealtimeEvent): void => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    } else {
      console.warn("WebSocket not connected, cannot send event:", event);
    }
  };

  const updateSession = (config: SessionConfig): void => {
    console.log("Skipping session update due to API requirements");

    sendEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              config.instructions ||
              "You are a helpful assistant. Always respond in English only.",
          },
        ],
      },
    });
  };

  const sendTextMessage = (text: string): void => {
    console.log("Sending text message:", text);

    sendEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: text,
          },
        ],
      },
    });

    sendEvent({
      type: "response.create",
    });
  };

  const cancelResponse = (): void => {
    sendEvent({
      type: "response.cancel",
    });
  };

  const on = (eventType: string, callback: Function): void => {
    if (!eventHandlers.has(eventType)) {
      eventHandlers.set(eventType, []);
    }
    eventHandlers.get(eventType)!.push(callback);
  };

  const off = (eventType: string, callback: Function): void => {
    const handlers = eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  };

  const disconnect = (): void => {
    if (ws) {
      ws.close();
      ws = null;
    }
    eventHandlers.clear();
  };

  const isConnected = (): boolean => {
    return ws?.readyState === WebSocket.OPEN;
  };

  return {
    connect,
    disconnect,
    sendTextMessage,
    cancelResponse,
    updateSession,
    isConnected,
    on,
    off,
    sendEvent,
  };
};
