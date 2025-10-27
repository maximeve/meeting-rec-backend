# MeetingRec API

This API provides endpoints for processing meeting transcriptions and extracting actionable points.

## Endpoints

### POST /api/actionable-points

Extracts actionable points from meeting transcriptions using AI.

#### Request Body

```json
{
  "transcription": "string (required) - The meeting transcription text",
  "context": "string (optional) - Additional context about the meeting"
}
```

#### Response

```json
{
  "ok": true,
  "actionablePoints": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "priority": "low" | "medium" | "high" | "urgent",
      "category": "string",
      "dueDate": "string" | "",
      "assignee": "string" | "",
      "status": "pending"
    }
  ]
}
```

#### Example Usage

```javascript
const response = await fetch('/api/actionable-points', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transcription: "We discussed the project timeline. John needs to complete the design by Friday. Sarah will review the code changes next week.",
    context: "Weekly team standup meeting"
  })
});

const data = await response.json();
console.log(data.actionablePoints);
```

## Environment Variables

Make sure to set the following environment variable:

- `OPENAI_API_KEY`: Your OpenAI API key for AI processing

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in your deployment platform (Vercel, etc.)

3. Deploy the API endpoints

## Features

- **CORS Support**: Handles cross-origin requests
- **Error Handling**: Robust error handling with fallbacks
- **JSON Parsing**: Tolerant JSON parsing for AI responses
- **Validation**: Input validation and sanitization
- **Priority Classification**: Automatic priority assignment based on context
- **Category Detection**: Intelligent categorization of actionable items
- **Due Date Extraction**: Automatic extraction of mentioned deadlines
- **Assignee Detection**: Identification of responsible parties
