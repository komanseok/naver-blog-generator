import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const RATE_LIMIT = { guest: 3, user: 20 };

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const limit = user ? RATE_LIMIT.user : RATE_LIMIT.guest;

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  let used = 0;

  if (user) {
    const { count } = await supabase
      .from('generation_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString());
    used = count ?? 0;
  } else {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const { count } = await supabase
      .from('generation_usage')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .is('user_id', null)
      .gte('created_at', since.toISOString());
    used = count ?? 0;
  }

  return Response.json({
    used,
    limit,
    remaining: Math.max(0, limit - used),
    isGuest: !user,
  });
}
