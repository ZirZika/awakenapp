# LevelUpLife

A gamified productivity and self-improvement app built with Expo, React Native, and Supabase.

---

## 🚀 Features
- Gamified quests (system, goal-based, AI-generated)
- Daily journal, goals, achievements, core values
- Real-time XP, leveling, and progress tracking
- Social features: friends, guilds, messaging
- Supabase authentication and database

---

## 🛠️ Setup & Installation

### 1. **Clone the Repository**
```bash
# HTTPS
git clone https://github.com/your-username/leveluplife.git
cd leveluplife_fresh
```

### 2. **Install Dependencies**
```bash
npm install
# or
yarn install
```

### 3. **Configure Environment Variables**
Create a `.env` file or set these in your environment:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. **Set Up Supabase Database**
- Go to your [Supabase dashboard](https://supabase.com/dashboard)
- Create a new project (or use your existing one)
- In the SQL Editor, run the SQL from:
  - `supabase/migrations/20250629131402_odd_feather.sql` (full schema)
  - If you get profile policy errors, also run `supabase/migrations/apply-profile-insert-policy.md`
- Enable Row Level Security (RLS) on all tables

### 5. **Run the App**
```bash
npm run dev
# or
npx expo start
```
- Open in Expo Go (mobile) or your browser (web)

---

## 🧑‍💻 Development Notes
- All code is in `/app`, `/components`, `/utils`, `/hooks`, `/lib`, `/types`
- Supabase logic is in `/lib/supabase.ts` and `/utils/supabaseStorage.ts`
- The War Journal UI is in `app/(tabs)/journal.tsx`
- The Bolt hackathon logo is in `/assets/images/`
- The folder `reference_folder_del_later/` is ignored by git

---

## 🐞 Troubleshooting
- **Database errors?**
  - Make sure you ran all SQL migrations in the Supabase dashboard
  - Check `URGENT-DATABASE-FIX.md` for policy fixes
- **Fonts not loading?**
  - Make sure you have a stable internet connection for Expo fonts
- **Auth not working?**
  - Double-check your Supabase keys and URL

---

## 📄 License
MIT