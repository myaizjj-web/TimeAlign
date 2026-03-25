# TimeAlign - Smart Global Scheduling 🌍🕰️

Find the perfect meeting time across any timezone globally. TimeAlign is a cloud-backed, collaborative scheduling platform designed to solve the pain of finding a common available time for remote teams or friends across different timezones.

## ✨ Key Features

- **🌍 Automatic Timezone Conversion**: Participants simply enter their available time slots in their local timezone. The system automatically calculates and unifies everyone's availability into the viewer's timezone to find the best overlapping slots.
- **🔢 6-Digit Meeting ID**: Generate a unique 6-digit meeting access code with one click. Others can quickly join the meeting session by sharing the code or link.
- **☁️ Real-time Cloud Sync**: Powered by a Supabase backend, data is persisted in the cloud. After clicking "Confirm Save", your availability is immediately updated and visible to all participants.
- **🖱️ Visual Drag-and-Drop Calendar**: Intuitively select your free time blocks by dragging across a visual weekly calendar interface.
- **🎨 Personalized Participant Cards**: Choose an emoji-based avatar or use the default initial-based avatar. The card UI clearly displays each person's available time slots.
- **📱 Responsive Modern UI**: Features a dark mode, glassmorphism design, and micro-animations to provide an excellent immersive experience on both desktop and mobile devices.

## 🚀 Live Demo

You can try out the deployed application immediately. Here is the typical workflow:
1. Create a new meeting or enter an existing 6-digit meeting ID.
2. Add your name and your local timezone.
3. Drag and select your available time slots on the calendar.
4. Click "Confirm Save" and then "Find Best Time" to see the perfect overlapping time with others!

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Modern features: Flexbox/Grid, CSS Variables, Animations), Vanilla JavaScript (no heavy frameworks, ultra-lightweight)
- **Backend / Database**: [Supabase](https://supabase.com/) (providing a robust PostgreSQL database and REST API)
- **Deployment**: Can be easily deployed to any static hosting platform (e.g., Netlify, Vercel). The project includes a `deploy.sh` script for quick updates.

## 📥 Local Development

This system runs purely on static files and remote Supabase API calls. No complex local Node.js environment is required.

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/timealign.git
   cd timealign
   ```

2. **Environment Variables**
   The project connects to Supabase via `app.js`. Please make sure to fill in your own Supabase URL and API Key in `app.js` (Note: for production, avoid exposing highly privileged keys):
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```

3. **Run Locally**
   You can run the project using any simple local web server. For example:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using Node.js
   npx live-server
   ```
   Then open your browser and navigate to `http://localhost:8000`.

## 🤝 Contributing

Issues and feature requests are welcome! If you want to contribute code:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the [MIT License](LICENSE).
