-- Add images to existing award definitions
UPDATE public.award_definitions 
SET image_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center'
WHERE name = 'Best Design';

UPDATE public.award_definitions 
SET image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center'
WHERE name = 'Fastest Time';

UPDATE public.award_definitions 
SET image_url = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&crop=center'
WHERE name = 'Most Creative';

UPDATE public.award_definitions 
SET image_url = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop&crop=center'
WHERE name = 'Best Teamwork';

UPDATE public.award_definitions 
SET image_url = 'https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=400&h=300&fit=crop&crop=center'
WHERE name = 'Crowd Favorite';

UPDATE public.award_definitions 
SET image_url = 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&h=300&fit=crop&crop=center'
WHERE name = 'Best Sportsmanship';