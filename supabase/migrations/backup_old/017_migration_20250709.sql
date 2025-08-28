-- Create sample invite codes for testing
INSERT INTO public.invites (code, created_by, status, expires_at) VALUES
('GIRLPOWER2024', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1), 'pending', NOW() + INTERVAL '30 days'),
('SISTERHOOD', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1), 'pending', NOW() + INTERVAL '30 days'),
('WELLNESS2024', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1), 'pending', NOW() + INTERVAL '30 days'),
('EMPOWERMENT', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1), 'pending', NOW() + INTERVAL '30 days'),
('STRONGWOMEN', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1), 'pending', NOW() + INTERVAL '30 days');

-- Create sample events
INSERT INTO public.events (title, description, start_time, end_time, location, max_capacity, current_capacity, price_cents, loyalty_points_price, status, created_by, image_url) VALUES
('Morning Yoga & Mindfulness', 'Start your day with gentle yoga and meditation practice. All levels welcome! Connect with like-minded women in a supportive environment.', 
 NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '90 minutes', 
 'Serenity Studio, Downtown', 15, 3, 2500, 150, 'upcoming', 
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1), 
 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'),

('Networking Brunch', 'Join us for a delightful brunch while building meaningful professional connections. Share experiences, exchange ideas, and support each other''s career growth.',
 NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '2 hours',
 'The Garden Café, Uptown', 25, 8, 4500, 250, 'upcoming',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'),

('Self-Defense Workshop', 'Learn practical self-defense techniques in a safe, supportive environment. Boost your confidence and personal safety skills.',
 NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours',
 'Community Center, Main Street', 20, 12, 3500, 200, 'upcoming',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'),

('Book Club: Empowering Women Authors', 'Discuss "Becoming" by Michelle Obama. A safe space to share thoughts and connect through literature.',
 NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days' + INTERVAL '90 minutes',
 'Cozy Corner Bookstore', 12, 5, 1500, 100, 'upcoming',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'),

('Women in Tech Panel', 'Inspiring panel discussion with successful women in technology. Q&A session and networking opportunities included.',
 NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '2.5 hours',
 'Innovation Hub, Tech District', 50, 23, 2000, 120, 'upcoming',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'),

('Cooking Class: Healthy Meal Prep', 'Learn to prepare nutritious, delicious meals for the week. Take home recipes and newfound skills!',
 NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '3 hours',
 'Culinary Arts Studio', 16, 9, 5500, 300, 'upcoming',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80');

-- Create sample challenges
INSERT INTO public.challenges (title, description, instructions, start_date, end_date, points_reward, status, created_by, badge_name, badge_image_url) VALUES
('10,000 Steps Daily Challenge', 'Walk 10,000 steps every day for a week! Track your progress and encourage each other.',
 'Log your daily steps using any fitness tracker or smartphone. Take a screenshot or photo as proof. Support your sisters by commenting on their progress!',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 50, 'active',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'Step Warrior', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),

('Mindfulness Week', 'Practice 10 minutes of mindfulness daily. Meditation, breathing exercises, or mindful walking all count!',
 'Spend at least 10 minutes each day in mindful practice. Share your experience and what techniques work best for you.',
 CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '9 days', 40, 'active',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'Zen Master', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),

('Hydration Challenge', 'Drink 8 glasses of water daily for 5 days. Stay hydrated and feel amazing!',
 'Track your water intake and share tips for staying hydrated. Bonus points for adding fruits or herbs to your water!',
 CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '6 days', 30, 'active',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'Hydration Hero', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),

('Random Acts of Kindness', 'Perform one random act of kindness each day for a week. Spread positivity!',
 'Do something kind for someone each day - it can be big or small! Share your acts of kindness (without identifying recipients) to inspire others.',
 CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '10 days', 60, 'active',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'Kindness Queen', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),

('Digital Detox Weekend', 'Take a break from social media and unnecessary screen time for 48 hours. Reconnect with yourself!',
 'Avoid social media, limit phone usage to essentials only. Read a book, go for walks, connect with friends in person. Share your experience after the challenge!',
 CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days', 45, 'active',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'Digital Warrior', 'https://images.unsplash.com/photo-1515378791036-0648a814c963?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),

('Morning Routine Challenge', 'Establish a consistent morning routine for 10 days. Start your day with intention!',
 'Create and stick to a morning routine that includes at least 3 activities (e.g., exercise, journaling, meditation, healthy breakfast). Share your routine and daily progress!',
 CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '11 days', 55, 'active',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'Morning Maven', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),

('Gratitude Journal Challenge', 'Write down 3 things you''re grateful for each day for two weeks. Cultivate appreciation and positivity!',
 'Keep a daily gratitude journal - write down 3 things you''re grateful for each day. Share your weekly reflections (without personal details) to inspire others.',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 35, 'active',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'Gratitude Goddess', 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),

('Learn Something New Challenge', 'Dedicate 30 minutes daily to learning a new skill for a week. Growth mindset in action!',
 'Choose any skill you want to learn - language, instrument, craft, coding, cooking technique, etc. Spend at least 30 minutes daily practicing. Share your progress and what you''re learning!',
 CURRENT_DATE + INTERVAL '4 days', CURRENT_DATE + INTERVAL '11 days', 50, 'active',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'Learning Legend', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),

('Workout Week Challenge', 'Complete at least 30 minutes of physical activity each day for 7 days. Move your body, feel amazing!',
 'Any physical activity counts - yoga, dancing, walking, gym workout, sports, etc. Take photos or videos of your activities (appropriate ones!) and encourage each other.',
 CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '9 days', 45, 'active',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'Fitness Fierce', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),

('Self-Care Sunday Challenge', 'Dedicate every Sunday for a month to self-care activities. You deserve it!',
 'Each Sunday, spend at least 2 hours on self-care activities - spa day at home, reading, hobby time, nature walks, whatever fills your cup! Share your self-care ideas.',
 CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '29 days', 40, 'active',
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
 'Self-Care Star', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80');

-- Create sample social posts
INSERT INTO public.social_posts (user_id, content, image_urls, is_story, expires_at, status) VALUES
((SELECT id FROM auth.users LIMIT 1 OFFSET 0), 
 'Just finished my morning yoga session! 🧘‍♀️ Nothing beats starting the day with mindfulness and movement. Who else is joining the morning routine challenge? #MorningMotivation #WellnessJourney', 
 ARRAY['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], 
 false, NULL, 'active'),

((SELECT id FROM auth.users LIMIT 1 OFFSET 0), 
 'Grateful for this amazing community of strong women! 💪✨ Today I''m thankful for: 1) My health 2) Supportive friends 3) New opportunities ahead. What are you grateful for today? #GratitudeChallenge #Blessed', 
 NULL, false, NULL, 'active'),

((SELECT id FROM auth.users LIMIT 1 OFFSET 0), 
 'Step count update: 12,847 steps today! 🚶‍♀️ Took the long way home and added some dancing in my living room 💃 The 10K steps challenge is really motivating me to move more! #StepsChallenge #ActiveLifestyle', 
 ARRAY['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], 
 false, NULL, 'active'),

((SELECT id FROM auth.users LIMIT 1 OFFSET 0), 
 'Self-care Sunday vibes! 🛁✨ Face mask, essential oils, and my favorite book. Sometimes the best medicine is just slowing down and nurturing ourselves. How are you practicing self-care today? #SelfCareSunday #MeTime', 
 ARRAY['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], 
 false, NULL, 'active'),

((SELECT id FROM auth.users LIMIT 1 OFFSET 0), 
 'Hydration check! 💧 Just finished my 6th glass of water today. Adding cucumber and mint makes it so refreshing! Who else is crushing the hydration challenge? Let''s keep each other accountable! #HydrationNation #HealthyHabits', 
 NULL, false, NULL, 'active'),

((SELECT id FROM auth.users LIMIT 1 OFFSET 0), 
 'Learning Spanish update: Week 2 complete! 📚 Today I learned how to order coffee in Spanish ☕ "Un café con leche, por favor!" Small wins count! What new skills are you working on? #LearningChallenge #GrowthMindset', 
 NULL, false, NULL, 'active'),

((SELECT id FROM auth.users LIMIT 1 OFFSET 0), 
 'Random act of kindness ✨ Bought coffee for the person behind me in line today. Their smile was absolutely priceless! Small gestures can brighten someone''s entire day 😊 #KindnessMatters #SpreadLove', 
 NULL, false, NULL, 'active'),

-- Story posts (expire after 24 hours)
((SELECT id FROM auth.users LIMIT 1 OFFSET 0), 
 'Morning meditation session complete! 🧘‍♀️✨ 10 minutes of peace before the day begins. #MindfulMorning', 
 ARRAY['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], 
 true, NOW() + INTERVAL '24 hours', 'active'),

((SELECT id FROM auth.users LIMIT 1 OFFSET 0), 
 'Healthy lunch prep done! 🥗 Quinoa bowls for the week ahead. Nutrition is self-care! #MealPrep #HealthyEating', 
 ARRAY['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], 
 true, NOW() + INTERVAL '24 hours', 'active');