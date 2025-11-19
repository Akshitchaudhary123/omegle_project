# WebSocket Client Setup Guide

## Overview
These are **WebSocket events**, not REST APIs. You need to use a Socket.IO client library to connect and listen to events.

---

## Step-by-Step Setup

### 1. Install Socket.IO Client (if using JavaScript/TypeScript)

```bash
npm install socket.io-client
```

### 2. Connect to WebSocket Server

```javascript
import { io } from 'socket.io-client';

// Replace with your server URL and user ID from login
const userId = 'YOUR_USER_ID_FROM_LOGIN'; // Get this from login response
const socket = io('http://localhost:3000', {
  query: {
    userId: userId  // REQUIRED: Pass userId in query
  }
});

// Connection event listeners
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

---

## 3. Listen to All Chat Events

```javascript
// ========== MATCHMAKING EVENTS ==========

// When waiting for a partner
socket.on('waiting', (data) => {
  console.log('⏳ Waiting for partner...', data);
  // data = { message: "Waiting for a partner..." }
});

// When partner is found
socket.on('partnerFound', (data) => {
  console.log('🎉 Partner found!', data);
  // data = { roomId: "507f1f77bcf86cd799439011", message: "Partner found!..." }
  // SAVE THE roomId - you'll need it for messaging!
  const roomId = data.roomId;
});

// ========== MESSAGING EVENTS ==========

// When you receive a message
socket.on('receiveMessage', (message) => {
  console.log('💬 New message received:', message);
  // message = {
  //   _id: "...",
  //   roomId: "...",
  //   senderId: "...",
  //   content: "Hello!",
  //   isRead: false,
  //   sentAt: "2024-01-15T10:30:00.000Z"
  // }
});

// ========== ROOM EVENTS ==========

// When your partner leaves
socket.on('partnerLeft', (data) => {
  console.log('👋 Partner left:', data);
  // data = { roomId: "...", message: "Your partner has left the chat" }
});

// When your partner disconnects
socket.on('partnerDisconnected', (data) => {
  console.log('🔌 Partner disconnected:', data);
  // data = { roomId: "...", message: "Your partner has disconnected" }
});

// When you successfully leave a room
socket.on('roomLeft', (data) => {
  console.log('🚪 You left the room:', data);
  // data = { roomId: "..." }
});

// When messages are marked as read
socket.on('messagesRead', (data) => {
  console.log('✅ Messages marked as read:', data);
  // data = { roomId: "..." }
});

// ========== ERROR EVENTS ==========

// When an error occurs
socket.on('error', (error) => {
  console.error('❌ Error:', error);
  // error = { message: "Error message here" }
});
```

---

## 4. Emit Events (Send Actions)

```javascript
// ========== FIND PARTNER ==========
socket.emit('findPartner');
// No payload needed - userId is already in connection query

// ========== SEND MESSAGE ==========
socket.emit('sendMessage', {
  roomId: '507f1f77bcf86cd799439011',  // From partnerFound event
  content: 'Hello, how are you?'
});

// ========== LEAVE ROOM ==========
socket.emit('leaveRoom', {
  roomId: '507f1f77bcf86cd799439011'
});

// ========== SKIP PARTNER ==========
socket.emit('skipPartner', {
  roomId: '507f1f77bcf86cd799439011'  // Optional, but recommended
});

// ========== MARK AS READ ==========
socket.emit('markAsRead', {
  roomId: '507f1f77bcf86cd799439011'
});
```

---

## Complete Example (React/JavaScript)

```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function ChatComponent({ userId }) {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3000', {
      query: { userId }
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected');
      setStatus('connected');
    });

    newSocket.on('disconnect', () => {
      setStatus('disconnected');
    });

    // Matchmaking events
    newSocket.on('waiting', (data) => {
      setStatus('waiting');
      console.log(data);
    });

    newSocket.on('partnerFound', (data) => {
      setStatus('chatting');
      setRoomId(data.roomId);
      console.log('Partner found! Room:', data.roomId);
    });

    // Messaging events
    newSocket.on('receiveMessage', (message) => {
      setMessages(prev => [...prev, message]);
      console.log('New message:', message);
    });

    // Room events
    newSocket.on('partnerLeft', (data) => {
      setStatus('partner_left');
      setRoomId(null);
      console.log('Partner left');
    });

    newSocket.on('partnerDisconnected', (data) => {
      setStatus('partner_disconnected');
      setRoomId(null);
      console.log('Partner disconnected');
    });

    // Error handling
    newSocket.on('error', (error) => {
      console.error('Error:', error);
      alert(error.message);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [userId]);

  // Functions to emit events
  const findPartner = () => {
    if (socket) {
      socket.emit('findPartner');
      setStatus('searching');
    }
  };

  const sendMessage = (content) => {
    if (socket && roomId) {
      socket.emit('sendMessage', {
        roomId: roomId,
        content: content
      });
    }
  };

  const leaveRoom = () => {
    if (socket && roomId) {
      socket.emit('leaveRoom', { roomId });
      setRoomId(null);
      setStatus('disconnected');
    }
  };

  const skipPartner = () => {
    if (socket && roomId) {
      socket.emit('skipPartner', { roomId });
      setRoomId(null);
      findPartner(); // Find new partner
    }
  };

  return (
    <div>
      <p>Status: {status}</p>
      {status === 'disconnected' && (
        <button onClick={findPartner}>Find Partner</button>
      )}
      {status === 'chatting' && (
        <div>
          <div>
            {messages.map((msg, i) => (
              <div key={i}>{msg.content}</div>
            ))}
          </div>
          <input 
            type="text" 
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage(e.target.value);
                e.target.value = '';
              }
            }}
          />
          <button onClick={skipPartner}>Skip</button>
          <button onClick={leaveRoom}>Leave</button>
        </div>
      )}
    </div>
  );
}
```

---

## Testing with Postman/Thunder Client

**You CANNOT test WebSocket events with Postman REST calls.** You need:

1. **Postman WebSocket support** (if available in your version)
2. **Browser console** - Open browser DevTools and run:
   ```javascript
   const socket = io('http://localhost:3000', {
     query: { userId: 'YOUR_USER_ID' }
   });
   
   socket.on('connect', () => console.log('Connected'));
   socket.on('partnerFound', (data) => console.log('Partner:', data));
   socket.on('receiveMessage', (msg) => console.log('Message:', msg));
   
   socket.emit('findPartner');
   ```

3. **Online Socket.IO Client**: Use https://amritb.github.io/socketio-client-tool/ or similar

---

## Summary

- **No REST API calls needed** for real-time chat
- **Connect once** with `userId` in query
- **Listen** to events using `socket.on('eventName', callback)`
- **Emit** actions using `socket.emit('eventName', payload)`
- **Save `roomId`** from `partnerFound` event for messaging

