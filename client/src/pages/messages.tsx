import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, MessageCircle, ArrowLeft, User, AlertTriangle, Shield } from "lucide-react";
import { chatApi, authApi, type UserChat, type ChatMessage } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export default function MessagesPage() {
  const [, params] = useRoute("/messages/:chatId");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChatId = params?.chatId;

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });

  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ["/api/chats"],
    queryFn: chatApi.getChats,
    enabled: !!currentUser,
    refetchInterval: 5000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chats", activeChatId, "messages"],
    queryFn: () => chatApi.getMessages(activeChatId!),
    enabled: !!activeChatId && !!currentUser,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, content }: { chatId: string; content: string }) =>
      chatApi.sendMessage(chatId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", activeChatId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setMessageInput("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChatId) return;
    sendMessageMutation.mutate({ chatId: activeChatId, content: messageInput.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  if (!currentUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Sign in to view messages</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in to access your messages.</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-medium text-amber-800 dark:text-amber-300">Stay protected!</span>
            <span className="text-amber-700 dark:text-amber-400"> Complete all transactions through Farmly. Off-app deals are not covered by our escrow protection and are at your own risk.</span>
          </div>
          <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          <Card className={`${activeChatId ? "hidden md:block" : ""}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {chatsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No conversations yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start a chat from a listing or user profile
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-340px)]">
                  <div className="divide-y">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => navigate(`/messages/${chat.id}`)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          chat.id === activeChatId ? "bg-muted" : ""
                        }`}
                        data-testid={`chat-${chat.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={chat.otherUser?.avatar || ""} />
                            <AvatarFallback>
                              {chat.otherUser?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium truncate">
                                {chat.otherUser?.name || "Unknown User"}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                {chat.otherUser?.role}
                              </Badge>
                              {chat.lastMessage && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {chat.lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className={`md:col-span-2 flex flex-col ${!activeChatId ? "hidden md:flex" : ""}`}>
            {!activeChatId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-1">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            ) : (
              <>
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => navigate("/messages")}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    {activeChat?.otherUser && (
                      <>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={activeChat.otherUser.avatar || ""} />
                          <AvatarFallback>
                            {activeChat.otherUser.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{activeChat.otherUser.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {activeChat.otherUser.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {activeChat.otherUser.location}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No messages yet</p>
                        <p className="text-sm text-muted-foreground">Send a message to start the conversation</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isOwn = message.senderId === currentUser?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                              data-testid={`message-${message.id}`}
                            >
                              <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? "flex-row-reverse" : ""}`}>
                                {!isOwn && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={message.sender?.avatar || ""} />
                                    <AvatarFallback>
                                      {message.sender?.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div
                                  className={`rounded-2xl px-4 py-2 ${
                                    isOwn
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                  <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                        data-testid="input-message"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || sendMessageMutation.isPending}
                        data-testid="button-send"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
