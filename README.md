FoodHub — Frontend (সংক্ষেপে)

FoodHub Frontend হলো ইউজারদের জন্য তৈরি করা ওয়েব অ্যাপ—যেখানে মানুষ খাবার খুঁজে পায়, অর্ডার দেয়, আর রেস্টুরেন্টগুলো তাদের মেনু ও অর্ডার ম্যানেজ করে।
এই repo–টা শুধু frontend; সব data, auth আর business logic আসে FoodHub Backend API থেকে।

কারা ব্যবহার করবে?

Everyone
খাবার ও রেস্টুরেন্ট ব্রাউজ, category ও price অনুযায়ী ফিল্টার, provider–এর পুরো মেনু দেখা।

Customers
একাউন্ট তৈরি, cart-এ খাবার যোগ, cash-on-delivery checkout, অর্ডার ট্র্যাক, রিভিউ ও প্রোফাইল আপডেট।

Providers
vendor হিসেবে রেজিস্ট্রেশন, business profile তৈরি, মেনু add/edit, অর্ডারের স্ট্যাটাস আপডেট।

Admins
ইউজার ম্যানেজ (suspend/activate), সব অর্ডার দেখা, ক্যাটাগরি ম্যানেজ।

Tech & UI

Next.js (React)

Tailwind CSS

Radix-style UI components

Better Auth (session + cookie based login)

Responsive design with Light/Dark mode

কীভাবে কাজ করে?

Frontend নিজে কোনো data রাখে না।
সব API call যায় Backend–এ, তাই চালানোর আগে শুধু দরকার:

NEXT_PUBLIC_API_URL=https://your-backend-api.com

এই URL দিয়েই meals, auth, orders—সবকিছু লোড হয়।

লোকালি রান করতে
npm install
npm run dev

তারপর খুলুন: http://localhost:3000

Backend ঠিকমতো না চললে বা env ভুল হলে data লোড হবে না—এটাই সবচেয়ে common issue।

Project structure (এক নজরে)

src/app/ — Pages & routes (home, meals, cart, orders, provider dashboard, admin)

src/components/ — Reusable UI components

src/contexts/ — Cart state (global)

src/lib/ — API client, auth client, utilities

src/types/ — Shared TypeScript types

Deploy

Vercel (recommended) বা যেকোনো Next.js hosting-এ deploy করা যায়।
Deploy করার সময় শুধু NEXT_PUBLIC_API_URL–এ live backend URL সেট করলেই হবে।

Bottom line

FoodHub Frontend হলো পুরো অ্যাপের মুখ (UI)।
Backend যেখানে brain, frontend সেখানে experience—clean, responsive, role-based dashboard সহ।
