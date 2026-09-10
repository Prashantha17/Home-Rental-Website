// src/components/ChatWidget.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { chatApi } from "../services/api";

const ChatWidget = () => {

  const { isAuthenticated, username: myUsername } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  // Fetch threads for inbox
  const fetchInbox = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await chatApi.getInbox();
      if (Array.isArray(data)) {
        setInbox(data);
      }
    } catch (err) {
      console.warn("Fetch inbox threads error:", err.message);
    }
  }, [isAuthenticated]);

  // Fetch sequential chat history
  const fetchChatHistory = useCallback(
    async (partner) => {
      if (!isAuthenticated || !partner) return;
      try {
        const data = await chatApi.getChatHistory(partner);
        if (Array.isArray(data)) {
          setMessages(data);
        }
      } catch (err) {
        console.warn("Fetch chat history error:", err.message);
      }
    },
    [isAuthenticated]
  );

  // Poll for messages when chat is active & tab is visible
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    fetchInbox();
    if (activePartner) {
      fetchChatHistory(activePartner);
    }

    const interval = setInterval(() => {
      // Only poll if document tab is active/visible
      if (document.visibilityState === "visible") {
        fetchInbox();
        if (activePartner) {
          fetchChatHistory(activePartner);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, activePartner, isAuthenticated, fetchInbox, fetchChatHistory]);

  // Scroll messages container to bottom on new updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load chat thread
  const handleOpenThread = async (partner) => {
    setActivePartner(partner);
    setLoading(true);
    await fetchChatHistory(partner);
    setLoading(false);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const textToSend = newMessage.trim();
    if (!textToSend || !activePartner || sending) return;

    setSending(true);
    setNewMessage("");

    try {
      const sentMsg = await chatApi.sendMessage(activePartner, textToSend);
      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg]);
        fetchInbox();
      }
    } catch (err) {
      console.error("Send message error:", err.message);
    } finally {
      setSending(false);
    }
  };

  // Listen to custom open-chat triggers from property cards
  useEffect(() => {
    const handleOpenChatTrigger = (e) => {
      const partner = e.detail?.owner;
      if (partner) {
        setIsOpen(true);
        handleOpenThread(partner);
      }
    };

    window.addEventListener("open-chat", handleOpenChatTrigger);
    return () => window.removeEventListener("open-chat", handleOpenChatTrigger);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className={`chat-widget-container ${isOpen ? "expanded" : "collapsed"}`}>
      {/* FLOATING ACTION TRIGGER */}
      {!isOpen && (
        <button
          type="button"
          className="chat-floating-btn shadow-2xl"
          onClick={() => setIsOpen(true)}
          aria-label="Open Direct Messages"
        >
          <span className="chat-icon-text">💬</span>
          <span className="pulse-glow" />
        </button>
      )}

      {/* CHAT CLIENT GLASS BOX */}
      {isOpen && (
        <div className="chat-window shadow-2xl border border-[#c4c6cf]/50">
          {/* HEADER */}
          <div className="chat-header">
            {activePartner ? (
              <div className="chat-header-details">
                <button
                  type="button"
                  className="back-threads-btn"
                  onClick={() => setActivePartner(null)}
                  aria-label="Back to threads"
                >
                  ←
                </button>
                <div className="avatar-small">👤</div>
                <div className="header-info">
                  <span className="partner-name">{activePartner}</span>
                  <span className="online-indicator">active chat</span>
                </div>
              </div>
            ) : (
              <div className="chat-header-inbox">
                <span className="title font-bold">Direct Messages</span>
                <button
                  type="button"
                  className="close-widget-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  ✕
                </button>
              </div>
            )}
            {activePartner && (
              <button
                type="button"
                className="close-widget-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                ✕
              </button>
            )}

          </div>

          {/* MAIN CHAT AREA */}
          <div className="chat-main">
            {activePartner ? (
              /* ACTIVE CONVERSATION WINDOW */
              <div className="conversation-container">
                {loading ? (
                  <p className="chat-helper-text">Retrieving chat thread...</p>
                ) : messages.length === 0 ? (
                  <div className="chat-empty-state">
                    <p>No messages yet. Send a direct message to start the conversation.</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((m) => {
                      const isMe = m.sender === myUsername;
                      return (
                        <div
                          key={m.id || m._id}
                          className={`message-bubble-row ${
                            isMe ? "outgoing-row" : "incoming-row"
                          }`}
                        >
                          <div className={`message-bubble ${isMe ? "outgoing" : "incoming"}`}>
                            <p className="msg-text">{m.text}</p>
                            <span className="msg-time">
                              {new Date(m.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* MESSAGE INPUT FORM */}
                <form onSubmit={handleSendMessage} className="message-form">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    aria-label="Message text"
                    required
                  />
                  <button
                    type="submit"
                    className="send-msg-btn"
                    disabled={sending || !newMessage.trim()}
                    aria-label="Send message"
                  >
                    ➤
                  </button>
                </form>
              </div>
            ) : (
              /* INBOX THREADS VIEW */
              <div className="inbox-threads-list">
                {inbox.length === 0 ? (
                  <div className="inbox-empty-state">
                    <span className="empty-icon">✉</span>
                    <p className="font-semibold">Your chat inbox is empty.</p>
                    <small className="text-gray-500">
                      Click 'Chat with Host' on any home listing to start a conversation.
                    </small>
                  </div>
                ) : (
                  inbox.map((thread) => {
                    const latest = thread.latestMessage;
                    const isMe = latest?.sender === myUsername;
                    return (
                      <div
                        key={thread.chatPartner}
                        onClick={() => handleOpenThread(thread.chatPartner)}
                        className="thread-item cursor-pointer hover:bg-gray-50 transition-colors"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleOpenThread(thread.chatPartner);
                        }}
                      >
                        <div className="avatar-medium">👤</div>
                        <div className="thread-body">
                          <div className="thread-top">
                            <span className="partner-username">{thread.chatPartner}</span>
                            <span className="timestamp-small">
                              {latest?.timestamp &&
                                new Date(latest.timestamp).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })}
                            </span>
                          </div>
                          <p className="latest-text">
                            {isMe ? "You: " : ""}
                            {latest?.text || ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
