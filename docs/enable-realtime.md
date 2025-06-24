# Enable Realtime for Requests

To enable realtime subscriptions for the requests feature, run the following SQL commands in your Supabase SQL editor:

```sql
-- Enable realtime for requests table
ALTER PUBLICATION supabase_realtime ADD TABLE requests;

-- Enable realtime for request_comments table
ALTER PUBLICATION supabase_realtime ADD TABLE request_comments;

-- Grant necessary permissions for realtime
GRANT SELECT ON requests TO authenticated;
GRANT SELECT ON request_comments TO authenticated;

-- Add RLS policies if not already exists
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'requests'
        AND policyname = 'Users can view requests'
    ) THEN
        CREATE POLICY "Users can view requests" ON requests
            FOR SELECT TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'request_comments'
        AND policyname = 'Users can view comments'
    ) THEN
        CREATE POLICY "Users can view comments" ON request_comments
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END $$;
```

After running these commands, the requests page will automatically receive live updates when:

- New requests are created
- Requests are updated (status changes, etc.)
- Requests are deleted
- Comments are added to requests

No page refresh required!
