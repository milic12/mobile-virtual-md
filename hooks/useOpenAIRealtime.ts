import { useCallback, useEffect, useRef, useState } from "react";
import {
  OpenAIRealtimeService,
  SessionConfig,
  createOpenAIRealtimeService,
} from "../services/openAIService";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isComplete: boolean;
}

export interface ConnectionStatus {
  status: "disconnected" | "connecting" | "connected" | "error";
  error?: string;
}

export const useOpenAIRealtime = (
  apiKey: string,
  specialistContext?: string
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "disconnected",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const serviceRef = useRef<OpenAIRealtimeService | null>(null);
  const currentResponseRef = useRef<string>("");
  const currentMessageIdRef = useRef<string>("");

  useEffect(() => {
    if (!apiKey) return;

    serviceRef.current = createOpenAIRealtimeService(apiKey);

    const service = serviceRef.current;

    service.on("connected", () => {
      setConnectionStatus({ status: "connected" });

      // initial instruction chat behaves like a clinician assistant
      setTimeout(() => {
        const systemMessage =
          specialistContext ||
          "You are a clinical information assistant for patients. Always respond in English only. Be concise, evidence‑aware, and empathetic.";

        service.sendEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "system",
            content: [
              {
                type: "input_text",
                text: systemMessage,
              },
            ],
          },
        });
      }, 100);
    });

    service.on("disconnected", (data: any) => {
      setConnectionStatus({
        status: "disconnected",
        error: data.reason,
      });
      setIsGenerating(false);
    });

    service.on("error", (error: any) => {
      setConnectionStatus({
        status: "error",
        error: error.message || "Connection error",
      });
      setIsGenerating(false);
    });

    service.on("response.created", (response: any) => {
      setIsGenerating(true);
      currentResponseRef.current = "";

      const messageId = `msg_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      currentMessageIdRef.current = messageId;

      const newMessage: ChatMessage = {
        id: messageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isComplete: false,
      };

      setMessages((prev) => [...prev, newMessage]);
    });

    service.on("response.text.delta", (delta: string, itemId: string) => {
      currentResponseRef.current += delta;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? { ...msg, content: currentResponseRef.current }
            : msg
        )
      );
    });

    service.on("response.text.done", (text: string, itemId: string) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? { ...msg, content: text, isComplete: true }
            : msg
        )
      );
      setIsGenerating(false);
    });

    service.on(
      "response.output_audio_transcript.delta",
      (delta: string, itemId: string) => {
        currentResponseRef.current += delta;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentMessageIdRef.current
              ? { ...msg, content: currentResponseRef.current }
              : msg
          )
        );
      }
    );

    service.on(
      "response.output_audio_transcript.done",
      (transcript: string, itemId: string) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentMessageIdRef.current
              ? { ...msg, content: transcript, isComplete: true }
              : msg
          )
        );
        setIsGenerating(false);
      }
    );

    service.on("response.done", (response: any) => {
      setIsGenerating(false);

      currentResponseRef.current = "";
      currentMessageIdRef.current = "";
    });

    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, [apiKey, specialistContext]);

  // connect to openAI realtime api
  const connect = useCallback(async () => {
    if (!serviceRef.current) return;

    setConnectionStatus({ status: "connecting" });

    try {
      await serviceRef.current.connect();
    } catch (error: any) {
      setConnectionStatus({
        status: "error",
        error: error.message || "Failed to connect",
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
    }
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!serviceRef.current || !serviceRef.current.isConnected()) {
      console.warn("Service not connected");
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: "user",
      content: text,
      timestamp: new Date(),
      isComplete: true,
    };

    setMessages((prev) => [...prev, userMessage]);

    // send to api
    serviceRef.current.sendTextMessage(text);
  }, []);

  const cancelResponse = useCallback(() => {
    if (serviceRef.current && serviceRef.current.isConnected()) {
      serviceRef.current.cancelResponse();
      setIsGenerating(false);
    }
  }, []);

  const updateSession = useCallback((config: SessionConfig) => {
    if (serviceRef.current && serviceRef.current.isConnected()) {
      serviceRef.current.updateSession(config);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    connectionStatus,
    isGenerating,
    connect,
    disconnect,
    sendMessage,
    cancelResponse,
    updateSession,
    clearMessages,
    isConnected: serviceRef.current?.isConnected() || false,
  };
};
