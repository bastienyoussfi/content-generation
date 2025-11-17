# Content Generation API

AI-agnostic NestJS module for generating high-quality, platform-optimized social media content. Uses OpenRouter for AI model flexibility with support for free models.

## Features

- **AI-Agnostic Architecture**: Easily switch between AI models (OpenAI, Claude, Gemini, Llama, etc.)
- **Free Models Support**: Start without paying using free models from OpenRouter
- **Platform Optimization**: Specialized strategies for each social platform
- **Anti-AI Slop**: Built-in validation to prevent generic, obvious AI-generated content
- **Quality Scoring**: Automatic content quality assessment
- **Multiple Platforms**: Twitter (more coming soon: LinkedIn, Instagram, Facebook)

## Quick Start

### 1. Installation

```bash
pnpm install
```

### 2. Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Get your OpenRouter API key from [https://openrouter.ai](https://openrouter.ai):
1. Sign up for free
2. Go to Keys section
3. Create a new API key
4. Add it to your `.env` file

```env
OPENROUTER_API_KEY=your_api_key_here
AI_MODEL=google/gemini-flash-1.5-8b
```

### 3. Run the Application

```bash
# Development
pnpm start:dev

# Production
pnpm build
pnpm start:prod
```

The API will be available at `http://localhost:3000/api`

## Docker Setup

Run the application using Docker for a consistent environment across all systems.

### Prerequisites

- Docker and Docker Compose installed on your system

### Using Docker Compose (Recommended)

1. **Copy environment file**:
```bash
cp .env.example .env
```

2. **Add your OpenRouter API key** to the `.env` file:
```env
OPENROUTER_API_KEY=your_api_key_here
AI_MODEL=google/gemini-flash-1.5-8b
```

3. **Start the application**:
```bash
docker-compose up -d
```

The API will be available at `http://localhost:3001/api` (mapped from internal port 3000)

4. **View logs**:
```bash
docker-compose logs -f app
```

5. **Stop the application**:
```bash
docker-compose down
```

### Docker Commands

```bash
# Build the image
docker-compose build

# Start in foreground (see logs directly)
docker-compose up

# Start in background
docker-compose up -d

# Restart the service
docker-compose restart

# View logs
docker-compose logs -f

# Stop and remove containers
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

### Access Points with Docker

- API: `http://localhost:3001/api`
- Swagger Documentation: `http://localhost:3001/docs`
- Health Check: `http://localhost:3001/api/content-generation/health`

### 4. Explore the API Documentation

Once the application is running, you can access the **interactive Swagger documentation** at:

- **Local Development**: http://localhost:3000/docs
- **Docker**: http://localhost:3001/docs

The Swagger UI provides:
- 📖 Complete API documentation
- 🧪 Interactive API testing (try endpoints directly from the browser)
- 📋 Request/response schemas with examples
- 🔍 Detailed parameter descriptions
- ✅ Real-time validation feedback

This is the easiest way to explore and test the API without writing any code!

## Usage

### Generate Content

**Endpoint**: `POST /api/content-generation/generate`

**Example Request**:

```json
{
  "platform": "twitter",
  "topic": "developer productivity tips",
  "tone": "conversational",
  "targetAudience": "software engineers",
  "includeHashtags": true,
  "format": "single"
}
```

**Example Response**:

```json
{
  "content": "Stop context-switching between 10 tools.\n\nI reduced my daily tool count from 12 to 3:\n- VS Code for coding\n- Linear for tasks\n- Slack for comms\n\nResult: 2x more deep work time.\n\nWhat's your essential 3?\n\n#DevProductivity #Coding",
  "platform": "twitter",
  "hashtags": ["DevProductivity", "Coding"],
  "metadata": {
    "model": "google/gemini-flash-1.5-8b",
    "provider": "openrouter",
    "tokensUsed": 245,
    "cost": 0,
    "qualityScore": 8.5,
    "characterCount": 234,
    "wordCount": 42,
    "estimatedEngagement": "high"
  },
  "validation": {
    "isValid": true,
    "score": 9,
    "warnings": [],
    "suggestions": []
  }
}
```

### API Endpoints

> **💡 Tip**: For complete API documentation with interactive testing, visit http://localhost:3000/docs (local) or http://localhost:3001/docs (Docker) when the server is running.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/content-generation/generate` | POST | Generate content for a platform |
| `/api/content-generation/platforms` | GET | Get available platforms |
| `/api/content-generation/platforms/:platform/constraints` | GET | Get platform constraints |
| `/api/content-generation/model/info` | GET | Get current AI model info |
| `/api/content-generation/models/free` | GET | Get available free models |
| `/api/content-generation/health` | GET | Health check |

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platform` | string | Yes | Platform name (e.g., "twitter") |
| `topic` | string | Yes | Content topic |
| `tone` | string | No | Tone: "professional", "casual", "conversational", "formal", "humorous" |
| `targetAudience` | string | No | Target audience description |
| `includeHashtags` | boolean | No | Whether to include hashtags |
| `includeEmojis` | boolean | No | Whether to include emojis |
| `callToAction` | string | No | Specific call to action |
| `format` | string | No | Format: "single" or "thread" |
| `temperature` | number | No | AI creativity (0-2, default: 0.7) |
| `maxTokens` | number | No | Max response length (100-4000) |

## Free Models Available

The following models are **completely free** on OpenRouter:

| Model | Provider | Best For | Speed |
|-------|----------|----------|-------|
| `google/gemini-flash-1.5-8b` | Google | General content | Very Fast |
| `meta-llama/llama-3.1-8b-instruct:free` | Meta | Quality content | Fast |
| `mistralai/mistral-7b-instruct:free` | Mistral | Efficient generation | Fast |
| `nousresearch/hermes-3-llama-3.1-405b:free` | Nous Research | High quality | Slow (rate limited) |

**Recommended**: Start with `google/gemini-flash-1.5-8b` for the best balance of speed, quality, and reliability.

## Upgrading to Paid Models

When you're ready for even better quality:

```env
# Change this in .env
AI_MODEL=anthropic/claude-3.5-sonnet
# or
AI_MODEL=openai/gpt-4-turbo
```

No code changes needed!

## Architecture

### Core Components

```
Content Generation Flow:
User Request → Platform Strategy → AI Provider → Validator → Optimizer → Response
```

1. **Platform Strategies**: Platform-specific optimization rules
2. **AI Provider**: Abstraction layer for any AI model
3. **Content Validator**: Anti-slop checks and quality scoring
4. **Platform Optimizer**: Final formatting and enhancement

### Anti-AI Slop Features

The module automatically detects and prevents:
- Generic corporate jargon ("synergy", "leverage", "paradigm shift")
- AI clichés ("delve", "unlock", "game-changer")
- Obvious AI phrases ("it's important to note", "in conclusion")
- Vague platitudes without specific examples
- Poor readability and sentence variety

Quality is scored on:
- **Authenticity** (no AI slop)
- **Engagement** (hooks, questions, numbers)
- **Clarity** (readability)
- **Platform fit** (follows best practices)

## Platform-Specific Features

### Twitter
- Character limit enforcement (280 chars)
- Thread support with "---" separators
- Hashtag optimization (1-2 max)
- Hook frameworks (APP, PAS, AIDA)
- Engagement elements (questions, numbers)

### Coming Soon
- LinkedIn (professional tone, articles)
- Instagram (captions + hashtag strategies)
- Facebook (engagement-focused, longer form)

## Development

```bash
# Run in development mode
pnpm start:dev

# Build
pnpm build

# Format code
pnpm format

# Lint
pnpm lint
```

## Adding New Platforms

1. Create strategy in `src/content-generation/strategies/`
2. Implement `PlatformStrategy` interface
3. Register in `PlatformOptimizerService`

Example:

```typescript
// linkedin.strategy.ts
@Injectable()
export class LinkedInStrategy implements PlatformStrategy {
  getPlatformName() { return 'linkedin'; }
  getConstraints() { return { maxLength: 3000, ... }; }
  generatePrompt(context) { /* LinkedIn-specific prompt */ }
  // ... implement other methods
}
```

## Adding New AI Providers

1. Create provider in `src/content-generation/providers/`
2. Implement `AIProvider` interface
3. Register in module

With OpenRouter, you already have access to 100+ models, so this is rarely needed!

## Cost Optimization

**Free Tier**:
- Use free models for testing and development
- No credit card required
- Perfect for MVP and learning

**Paid Tier**:
- Upgrade only when you need higher quality
- Set spending limits in OpenRouter dashboard
- Track costs per request in response metadata

## Example Use Cases

### Twitter Thread Generator
```json
{
  "platform": "twitter",
  "topic": "building a startup in 2024",
  "format": "thread",
  "tone": "conversational",
  "targetAudience": "aspiring founders"
}
```

### Professional LinkedIn Post
```json
{
  "platform": "linkedin",
  "topic": "leadership lessons from scaling a team",
  "tone": "professional",
  "targetAudience": "engineering managers"
}
```

## License

MIT

## Support

For issues and questions:
- Check the `/api/content-generation/health` endpoint
- Review logs for detailed error messages
- Ensure your OpenRouter API key is valid

## Roadmap

- [ ] LinkedIn strategy
- [ ] Instagram strategy
- [ ] Facebook strategy
- [ ] Content scheduling integration
- [ ] A/B testing framework
- [ ] Performance analytics
- [ ] Custom prompt templates
- [ ] Webhook support
- [ ] Multi-language support
