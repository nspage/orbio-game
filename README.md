# OrbIO Game

OrbIO is a multiplayer .io-style game built with P5.js, WebSockets, and blockchain integration. In this game, players control orbs that grow by collecting smaller orbs and can consume smaller players.

## Features

- Real-time multiplayer using WebSockets
- Mobile-first responsive design with touch controls
- Telegram authentication for player identification
- TON blockchain integration
- Smooth gameplay and visually appealing assets created with P5.js

## How to Play

1. Log in with Telegram, connect a TON wallet, or play as a guest
2. Control your orb using mouse (desktop) or touch (mobile)
3. Collect smaller orbs to grow in size
4. Try to consume smaller players while avoiding larger ones
5. Compete for the top spot on the leaderboard

## Setup Instructions

1. Clone this repository
2. Run `npm install` to install dependencies
3. Create a `.env` file with your configuration
4. Run `npm start` to start the server
5. Visit `http://localhost:3000` to play the game

## Mobile Controls

- Use the on-screen joystick to move your orb
- The game automatically detects mobile devices and shows touch controls

## Authentication

- Telegram Login Widget for user authentication
- TON Connect for blockchain wallet integration
- Guest mode available for quick play

## License

This project is for educational purposes only.
