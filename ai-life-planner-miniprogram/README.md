# AI Career & Life Planning Emotion Cards - WeChat Mini Program

This is a native WeChat Mini Program that uses AI (via Tencent CloudBase) to conduct Socratic, first-principles career/life planning dialogues and generate 3-5 shareable "emotion cards" with chibi-style illustrations.

## Features
- WeChat native login
- Multi-turn AI chat enforcing dialogue rules (one question at a time, goal confirmation first, etc.)
- Generates personalized future planning emotion cards (Risk/Execution/Benefit metrics)
- Chibi cartoon central illustrations generated via Hunyuan AI image model
- Share selected card to WeChat Moments

## Tech Stack
- Native WeChat Mini Program (WXML/JS/WXSS)
- Tencent CloudBase for AI (LLM streaming + hunyuan-image)
- Canvas for card rendering and share images

## Setup Instructions

### 1. CloudBase Environment
- Create a CloudBase environment in WeChat DevTools or Tencent Cloud console (Shanghai region recommended)
- Enable AI capabilities: purchase token pack, enable models like hunyuan, deepseek, hunyuan-image
- Initialize cloud in app.js with your env ID

### 2. Project in WeChat DevTools
- Open WeChat Developer Tools
- Import this project folder
- Configure app.json with your CloudBase env
- Test on simulator/device

### 3. Key Configs
- Update `cloudEnvId` in app.js
- Ensure Mini Program basic library >= 3.15.1 for AI features
- Add server domain or use cloud for API calls

## Running
No local dev server needed beyond WeChat DevTools. Use cloud functions for AI calls.

## File Structure
See plan for details.

## Important Notes
- All AI prompts enforce the specified rules: first-principles, Occam's razor, Socratic questioning, step-by-step info collection.
- Cards limited to <100 chars per metric point.
- Illustrations match the narrative descriptions.
- Follow WeChat content guidelines for AI-generated advice.

Built following the attached implementation plan.