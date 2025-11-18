# Chat Service - Usage Guide

## Overview
This chat service provides real-time messaging functionality similar to Omegle, where users can be randomly matched with partners for anonymous or identified chats.

## Prerequisites
1. MongoDB connection configured
2. Redis connection configured
3. JWT authentication set up
4. WebSocket support enabled

## Starting the Chat Service

### 1. Start the NestJS Application
```bash
npm run start:dev
```

The WebSocket gateway will be available at the same port as your HTTP server (default: 3000).

### 2. Connect to WebSocket
Connect to the WebSocket server using Socket.IO client:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  query: {
    userId: 'YOUR_USER_ID' // Required: User ID from authentication
  }
});
```

## WebSocket Events

### Client → Server Events

#### 1. `findPartner`
Find a random partner to chat with.

**Payload:** None

**Example:**
```javascript
socket.emit('findPartner');
```

**Response Events:**
- `waiting` - When no partner is available yet
  ```json
  {
    "message": "Waiting for a partner..."
  }
  ```
- `partnerFound` - When a partner is found
  ```json
  {
    "roomId": "507f1f77bcf86cd799439011",
    "message": "Partner found! You can start chatting now."
  }
  ```
- `error` - If an error occurs
  ```json
  {
    "message": "Error message here"
  }
  ```

#### 2. `sendMessage`
Send a message to the current room.

**Payload:**
```json
{
  "roomId": "507f1f77bcf86cd799439011",
  "content": "Hello, how are you?"
}
```

**Example:**
```javascript
socket.emit('sendMessage', {
  roomId: '507f1f77bcf86cd799439011',
  content: 'Hello, how are you?'
});
```

**Response Events:**
- `receiveMessage` - Message sent successfully (broadcasted to all room participants)
  ```json
  {
    "_id": "507f1f77bcf86cd799439012",
    "roomId": "507f1f77bcf86cd799439011",
    "senderId": "507f1f77bcf86cd799439013",
    "content": "Hello, how are you?",
    "isRead": false,
    "sentAt": "2024-01-15T10:30:00.000Z"
  }
  ```
- `error` - If message sending fails
  ```json
  {
    "message": "Error message here"
  }
  ```

#### 3. `leaveRoom`
Leave the current chat room.

**Payload:**
```json
{
  "roomId": "507f1f77bcf86cd799439011"
}
```

**Example:**
```javascript
socket.emit('leaveRoom', {
  roomId: '507f1f77bcf86cd799439011'
});
```

**Response Events:**
- `roomLeft` - Successfully left the room
  ```json
  {
    "roomId": "507f1f77bcf86cd799439011"
  }
  ```
- `partnerLeft` - Emitted to the partner when you leave
  ```json
  {
    "roomId": "507f1f77bcf86cd799439011",
    "message": "Your partner has left the chat"
  }
  ```

#### 4. `skipPartner`
Skip current partner and find a new one.

**Payload:**
```json
{
  "roomId": "507f1f77bcf86cd799439011" // Optional
}
```

**Example:**
```javascript
socket.emit('skipPartner', {
  roomId: '507f1f77bcf86cd799439011'
});
```

#### 5. `markAsRead`
Mark all messages in a room as read.

**Payload:**
```json
{
  "roomId": "507f1f77bcf86cd799439011"
}
```

**Example:**
```javascript
socket.emit('markAsRead', {
  roomId: '507f1f77bcf86cd799439011'
});
```

**Response Events:**
- `messagesRead` - Messages marked as read
  ```json
  {
    "roomId": "507f1f77bcf86cd799439011"
  }
  ```

### Server → Client Events

#### `receiveMessage`
Received when a new message is sent in the room.

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "roomId": "507f1f77bcf86cd799439011",
  "senderId": "507f1f77bcf86cd799439013",
  "content": "Hello!",
  "isRead": false,
  "sentAt": "2024-01-15T10:30:00.000Z"
}
```

#### `partnerDisconnected`
Received when your partner disconnects.

```json
{
  "roomId": "507f1f77bcf86cd799439011",
  "message": "Your partner has disconnected"
}
```

## REST API Endpoints

All REST endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### 1. Get User's Rooms
Get all active rooms for the current user.

**Endpoint:** `GET /chat/rooms`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "participants": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "John Doe",
        "email": "john@example.com"
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    ],
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "endedAt": null,
    "lastMessage": "Hello, how are you?"
  }
]
```

### 2. Get Room Details
Get details of a specific room.

**Endpoint:** `GET /chat/rooms/:roomId`

**Example:**
```bash
curl -X GET http://localhost:3000/chat/rooms/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "participants": [...],
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "endedAt": null,
  "lastMessage": "Hello, how are you?"
}
```

### 3. Get Room Messages
Get messages from a specific room.

**Endpoint:** `GET /chat/rooms/:roomId/messages`

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 50, max: 100)
- `skip` (optional): Number of messages to skip (default: 0)

**Example:**
```bash
curl -X GET "http://localhost:3000/chat/rooms/507f1f77bcf86cd799439011/messages?limit=20&skip=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "roomId": "507f1f77bcf86cd799439011",
    "senderId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "content": "Hello!",
    "isRead": true,
    "sentAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### 4. End Room
End/close a chat room.

**Endpoint:** `POST /chat/rooms/:roomId/end`

**Example:**
```bash
curl -X POST http://localhost:3000/chat/rooms/507f1f77bcf86cd799439011/end \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "participants": [...],
  "isActive": false,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "endedAt": "2024-01-15T11:00:00.000Z",
  "lastMessage": "Goodbye!"
}
```

### 5. Mark Messages as Read
Mark all unread messages in a room as read.

**Endpoint:** `POST /chat/rooms/:roomId/messages/read`

**Example:**
```bash
curl -X POST http://localhost:3000/chat/rooms/507f1f77bcf86cd799439011/messages/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Messages marked as read"
}
```

## Complete Example Flow

### Frontend Implementation (React/JavaScript)

```javascript
import { io } from 'socket.io-client';
import axios from 'axios';

class ChatService {
  constructor(userId, token) {
    this.userId = userId;
    this.token = token;
    this.socket = null;
    this.currentRoomId = null;
  }

  connect() {
    this.socket = io('http://localhost:3000', {
      query: { userId: this.userId }
    });

    // Listen for events
    this.socket.on('waiting', (data) => {
      console.log('Waiting for partner...', data);
    });

    this.socket.on('partnerFound', (data) => {
      console.log('Partner found!', data);
      this.currentRoomId = data.roomId;
    });

    this.socket.on('receiveMessage', (message) => {
      console.log('New message:', message);
      // Update UI with new message
    });

    this.socket.on('partnerDisconnected', (data) => {
      console.log('Partner disconnected', data);
      this.currentRoomId = null;
    });

    this.socket.on('partnerLeft', (data) => {
      console.log('Partner left', data);
      this.currentRoomId = null;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  findPartner() {
    this.socket.emit('findPartner');
  }

  sendMessage(content) {
    if (!this.currentRoomId) {
      console.error('No active room');
      return;
    }

    this.socket.emit('sendMessage', {
      roomId: this.currentRoomId,
      content: content
    });
  }

  leaveRoom() {
    if (!this.currentRoomId) return;
    
    this.socket.emit('leaveRoom', {
      roomId: this.currentRoomId
    });
    this.currentRoomId = null;
  }

  skipPartner() {
    this.socket.emit('skipPartner', {
      roomId: this.currentRoomId
    });
    this.currentRoomId = null;
  }

  async getRoomMessages(roomId, limit = 50, skip = 0) {
    const response = await axios.get(
      `http://localhost:3000/chat/rooms/${roomId}/messages`,
      {
        params: { limit, skip },
        headers: { Authorization: `Bearer ${this.token}` }
      }
    );
    return response.data;
  }

  async getUserRooms() {
    const response = await axios.get('http://localhost:3000/chat/rooms', {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Usage
const chatService = new ChatService('USER_ID', 'JWT_TOKEN');
chatService.connect();
chatService.findPartner();

// After partner is found
chatService.sendMessage('Hello!');
```

## Testing with Postman/Thunder Client

### 1. Get User Rooms
```
GET http://localhost:3000/chat/rooms
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 2. Get Room Messages
```
GET http://localhost:3000/chat/rooms/ROOM_ID/messages?limit=20
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. End Room
```
POST http://localhost:3000/chat/rooms/ROOM_ID/end
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

## Notes

1. **User ID**: Must be provided in the WebSocket connection query parameter
2. **JWT Token**: Required for all REST API endpoints
3. **Room Lifecycle**: Rooms are automatically marked as inactive when a user disconnects
4. **Message Ordering**: Messages are returned in descending order (newest first)
5. **Read Status**: Messages are marked as read when `markAsRead` is called
6. **Error Handling**: Always listen for `error` events on the socket

