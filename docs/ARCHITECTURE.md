# KuranguPedalFC.ai Architecture

## Vision
KuranguPedalFC.ai is a fantasy football buddy that helps choose the best weekly squad, captain, and transfer decisions using football data, news, and a small set of specialist services.

## What the user sees
A clean website with:
- Current squad
- Suggested starting XI
- Captain and vice-captain
- Weekly notes
- Why these picks
- Confidence / selection rating

## What happens behind the scenes

### 1) User request
The user asks something like:
- Who should I captain?
- Should I transfer anyone?
- Build my best Gameweek 1 team.

### 2) Recommendation Engine
This is the main backend layer. It coordinates the football services.

### 3) Medical Review
Checks player availability, injuries, and doubt flags.

### 4) Fixture Review
Checks upcoming fixture difficulty and schedule timing.

### 5) Scout Review
Checks form, value, points, and ownership to find strong picks and differentials.

### 6) News Review
Checks recent articles, press notes, and football updates.

### 7) Head Coach Review
Combines all signals and produces the final recommendation.

### 8) Output
The final result is written into `dashboard.json`.

### 9) Website
The GitHub Pages site reads `dashboard.json` and displays the recommendation.

## Internal design principle
The website stays simple.
The intelligence lives in the backend.

## Mapping to AI concepts
- Tokens: user question
- Embeddings: similarity search over football data and news
- Transformer / LLM: language understanding and explanation
- Tool calling: live FPL data, news sources
- RAG: retrieve relevant football context
- Planning: break the request into steps
- Multi-service flow: medical, fixture, scout, news, coach
- Judge / review: final confidence check
- Memory: user style and preferences
- Guardrails: avoid risky or low-confidence recommendations

## Weekly refresh
The system should refresh every week:
- fetch fresh football data
- recompute recommendations
- update `dashboard.json`
- refresh the website

## Design goal
Make the product feel like a football buddy, not an AI demo.
