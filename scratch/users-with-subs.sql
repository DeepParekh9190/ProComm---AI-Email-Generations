SELECT p.email, p.name, p.role, s.plan, s.status, s.monthly_usage
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id
ORDER BY p.created_at DESC;
