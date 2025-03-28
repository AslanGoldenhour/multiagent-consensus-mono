flowchart TD
A[Project Setup] --> B[Load Environment Config]
B --> C[Instantiate Core Module with Config]
C --> D[Setup LLM Presets - Rightwing, Leftwing, Centrist, PhD, High School]
D --> E[Allow Custom Prompts / YOLO Mode]
E --> F[Start Multi-Agent Debate]
F --> G[Parallel or Turn-Based Debate Logic]
G --> H[Apply Consensus Mechanism - Majority, Super Majority, Unanimous]
H --> I[Limit Debate Rounds]
I --> J[Collect Self-Assessed Confidence Ratings]
J --> K[Generate Output Object with Metadata]
K --> L[Configure Output Formats: Best Answer, Chat History, Summary]
K --> M[Log Processing Info: Models, Time, Token Count]
F --> N[Integrate Inngest for Durability and Async Operations]
N --> O[Handle Rate Limits and API Failures]
O --> P[Invoke Logging and Debugging Tools]
P --> Q[Update UI Dashboard]
Q --> R[NextJS UI Dashboard with Tailwind CSS and Shadcn]
R --> S[Inspect Call History and Flag Responses]
S --> T[API Integration between Core Module and UI Layer]
