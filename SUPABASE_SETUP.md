# Supabase Setup Documentation

## Project Configuration

This project uses a hosted Supabase instance with the following configuration:

- **Project ID**: rznvmbxhfnyqcyanxptq
- **Project URL**: https://rznvmbxhfnyqcyanxptq.supabase.co
- **Region**: US West 1

## Environment Variables

The project requires the following environment variables to be set in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: The Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous/public key for client-side access
- `SUPABASE_SERVICE_ROLE_KEY`: The service role key for server-side operations
- `DATABASE_URL`: The pooled connection string for Prisma (with pgbouncer)
- `DIRECT_URL`: The direct connection string for Prisma migrations

## Database Password

You need to get your database password from your Supabase dashboard:

1. Go to Settings > Database
2. Find your database password
3. Replace `[YOUR-PASSWORD]` in the DATABASE_URL and DIRECT_URL with your actual password

## Important Notes

- Never commit the `.env.local` file to version control
- The service role key should only be used server-side
- The anon key is safe to use in client-side code
- Database migrations should use the DIRECT_URL
- Application queries should use the pooled DATABASE_URL for better performance
