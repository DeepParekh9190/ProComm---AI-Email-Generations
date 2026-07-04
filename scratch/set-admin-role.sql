UPDATE public.profiles
SET role = 'admin'
WHERE email = 'officialdeepparekh919@gmail.com';

SELECT id, email, name, role FROM public.profiles ORDER BY role DESC;
