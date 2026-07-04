## Error Type
Runtime Error

## Error Message
Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.


    at middleware (middleware.js:11:38)

## Code Frame
   9 |   let supabaseResponse = NextResponse.next({ request });
  10 |
> 11 |   const supabase = createServerClient(
     |                                      ^
  12 |     process.env.NEXT_PUBLIC_SUPABASE_URL,
  13 |     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  14 |     {

Next.js version: 15.5.19 (Webpack)
