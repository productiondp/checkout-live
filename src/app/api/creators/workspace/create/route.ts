import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    
    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { opportunityId, creatorId } = await req.json();

    if (!opportunityId || !creatorId) {
      return NextResponse.json({ error: 'Missing opportunityId or creatorId' }, { status: 400 });
    }

    // 1. Fetch Opportunity to ensure business owns it
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    if (opportunity.business_id !== user.id) {
      return NextResponse.json({ error: 'Only the business owner can create a workspace' }, { status: 403 });
    }

    // 2. Create Chat Room
    const { data: chatRoom, error: chatError } = await supabase
      .from('chat_rooms')
      .insert([{ title: `Workspace: ${opportunity.title}`, is_group: true }])
      .select()
      .single();

    if (chatError) throw chatError;

    // 3. Add Participants to Chat Room (Business & Creator)
    await supabase.from('participants').insert([
      { room_id: chatRoom.id, user_id: user.id },
      { room_id: chatRoom.id, user_id: creatorId }
    ]);

    // 4. Create Workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert([{
        opportunity_id: opportunityId,
        business_id: user.id,
        creator_id: creatorId,
        room_id: chatRoom.id,
        status: 'ACTIVE'
      }])
      .select()
      .single();

    if (workspaceError) throw workspaceError;

    // 5. Update Opportunity Status
    await supabase
      .from('opportunities')
      .update({ status: 'ACTIVE' })
      .eq('id', opportunityId);

    // 6. Log Initial Activity
    await supabase.from('workspace_activities').insert([{
      workspace_id: workspace.id,
      actor_id: user.id,
      type: 'WORKSPACE_CREATED',
      description: 'Workspace automatically created upon hiring.'
    }]);

    // 7. Send Notification
    await supabase.from('notifications').insert([{
      user_id: creatorId,
      title: 'You got hired!',
      message: `A new workspace for ${opportunity.title} has been created.`,
      type: 'WORKSPACE',
      link: `/creators/workspace/${workspace.id}`
    }]);

    return NextResponse.json({ 
      success: true,
      workspaceId: workspace.id 
    });

  } catch (error: any) {
    console.error('Workspace Creation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
