import { router } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSpecialist } from "../../contex/SpecialistContext";
import { auth } from "../../firebase/config";
import { useOpenAIRealtime } from "../../hooks/useOpenAIRealtime";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

export default function Chat() {
  const [message, setMessage] = useState("");
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { selectedSpecialist } = useSpecialist();

  const specialistContext = selectedSpecialist
    ? `${selectedSpecialist.bio} Always respond in English only. Be concise, evidence-aware, and empathetic.`
    : undefined;

  const {
    messages,
    connectionStatus,
    isGenerating,
    connect,
    disconnect,
    sendMessage,
    isConnected,
  } = useOpenAIRealtime(OPENAI_API_KEY, specialistContext);

  // connect on mount
  useEffect(() => {
    if (OPENAI_API_KEY && OPENAI_API_KEY.length > 0) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isGenerating]);

  const handleSignOut = async () => {
    try {
      disconnect();
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      sendMessage(message.trim());
      setMessage("");
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleConnect = () => {
    if (
      connectionStatus.status === "disconnected" ||
      connectionStatus.status === "error"
    ) {
      connect();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              {selectedSpecialist ? selectedSpecialist.name : "AI Chat"}
            </Text>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    connectionStatus.status === "connected"
                      ? "#00C851"
                      : connectionStatus.status === "connecting"
                      ? "#ffbb33"
                      : "#ff4444",
                },
              ]}
            />
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleSignOut}
          >
            <Text style={styles.profileButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {connectionStatus.status === "disconnected" ||
        connectionStatus.status === "error" ? (
          <View style={styles.connectionPrompt}>
            <Text style={styles.connectionPromptTitle}>
              {connectionStatus.status === "error"
                ? "Connection Error"
                : "Disconnected"}
            </Text>
            <Text style={styles.connectionPromptText}>
              {connectionStatus.error ||
                "Tap to connect to OpenAI Realtime API"}
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnect}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        ) : connectionStatus.status === "connecting" ? (
          <View style={styles.connectionPrompt}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.connectionPromptText}>Connecting...</Text>
          </View>
        ) : (
          <>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContentContainer}
            >
              {messages.length === 0 ? (
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeText}>
                    {selectedSpecialist
                      ? `Start a conversation with ${selectedSpecialist.name}!`
                      : "Start a conversation with Specialists!"}
                  </Text>
                </View>
              ) : (
                messages.map((msg, index) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageItem,
                      msg.role === "user"
                        ? styles.userMessage
                        : styles.assistantMessage,
                      index === messages.length - 1 ? styles.lastMessage : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.role === "user"
                          ? styles.userMessageText
                          : styles.assistantMessageText,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                ))
              )}
              {isGenerating && (
                <View
                  style={[
                    styles.messageItem,
                    styles.assistantMessage,
                    styles.lastMessage,
                  ]}
                >
                  <ActivityIndicator size="small" color="#667" />
                  <Text style={styles.typingText}>AI is thinking...</Text>
                </View>
              )}
            </ScrollView>

            <View
              style={[
                styles.inputContainer,
                { paddingBottom: insets.bottom + 5 },
              ]}
            >
              <TextInput
                style={styles.textInput}
                value={message}
                onChangeText={setMessage}
                placeholder={
                  isConnected ? "Type a message..." : "Not connected"
                }
                multiline
                maxLength={500}
                editable={isConnected}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!isConnected || !message.trim()) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!isConnected || !message.trim()}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  profileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginLeft: 8,
  },
  profileButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  chatArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  connectionPrompt: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  connectionPromptTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  connectionPromptText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  connectButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  messageItem: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    maxWidth: "80%",
  },
  lastMessage: {
    marginBottom: 20,
  },
  userMessage: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  assistantMessage: {
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#ffffff",
  },
  assistantMessageText: {
    color: "#333",
  },
  typingIndicator: {
    marginTop: 8,
  },
  typingText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    backgroundColor: "#ffffff",
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
