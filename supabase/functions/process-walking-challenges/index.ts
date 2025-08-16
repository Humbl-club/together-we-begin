import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      challenges: {
        Row: {
          id: string;
          title: string;
          challenge_type: string;
          step_goal: number;
          start_date: string;
          end_date: string;
          status: string;
          auto_award_enabled: boolean;
          winner_reward_points: number;
          runner_up_reward_points: number;
          participation_reward_points: number;
        };
      };
      challenge_cycles: {
        Row: {
          id: string;
          parent_challenge_id: string;
          cycle_start: string;
          cycle_end: string;
          status: string;
          winner_user_id?: string;
          runner_up_user_id?: string;
          participants_count: number;
        };
      };
      walking_leaderboards: {
        Row: {
          challenge_id: string;
          user_id: string;
          total_steps: number;
          daily_steps: any;
          last_updated: string;
          is_validated: boolean;
        };
      };
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing walking challenges...');

    // Get all active recurring challenges
    const { data: recurringChallenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .in('challenge_type', ['weekly_recurring', 'monthly_recurring'])
      .eq('status', 'active');

    if (challengesError) {
      console.error('Error fetching recurring challenges:', challengesError);
      throw challengesError;
    }

    console.log(`Found ${recurringChallenges?.length || 0} recurring challenges`);

    for (const challenge of recurringChallenges || []) {
      await processRecurringChallenge(supabase, challenge);
    }

    // Process completed challenge cycles
    await processCompletedCycles(supabase);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Walking challenges processed successfully',
        processed_challenges: recurringChallenges?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing walking challenges:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function processRecurringChallenge(supabase: any, challenge: any) {
  const now = new Date();
  const cycleLength = challenge.challenge_type === 'weekly_recurring' ? 7 : 30;
  
  // Check if we need to create a new cycle
  const { data: activeCycle } = await supabase
    .from('challenge_cycles')
    .select('*')
    .eq('parent_challenge_id', challenge.id)
    .eq('status', 'active')
    .single();

  if (!activeCycle) {
    // Create new cycle
    const cycleStart = new Date();
    const cycleEnd = new Date();
    cycleEnd.setDate(cycleEnd.getDate() + cycleLength);

    const { error: cycleError } = await supabase
      .from('challenge_cycles')
      .insert({
        parent_challenge_id: challenge.id,
        cycle_start: cycleStart.toISOString(),
        cycle_end: cycleEnd.toISOString(),
        status: 'active'
      });

    if (cycleError) {
      console.error('Error creating new cycle:', cycleError);
    } else {
      console.log(`Created new ${challenge.challenge_type} cycle for challenge ${challenge.id}`);
    }
  } else {
    // Check if current cycle should be completed
    const cycleEnd = new Date(activeCycle.cycle_end);
    if (now >= cycleEnd) {
      await completeCycle(supabase, activeCycle, challenge);
    }
  }
}

async function completeCycle(supabase: any, cycle: any, challenge: any) {
  console.log(`Completing cycle ${cycle.id} for challenge ${challenge.id}`);

  try {
    // Get leaderboard for this cycle
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('walking_leaderboards')
      .select(`
        user_id,
        total_steps,
        profiles!user_id (
          full_name,
          available_loyalty_points,
          total_loyalty_points
        )
      `)
      .eq('challenge_id', challenge.id)
      .eq('is_validated', true)
      .order('total_steps', { ascending: false })
      .limit(10);

    if (leaderboardError) throw leaderboardError;

    let winner_user_id = null;
    let runner_up_user_id = null;

    if (leaderboard && leaderboard.length > 0) {
      // Award points if auto-award is enabled
      if (challenge.auto_award_enabled) {
        await awardPoints(supabase, leaderboard, challenge);
      }

      winner_user_id = leaderboard[0]?.user_id;
      runner_up_user_id = leaderboard[1]?.user_id;
    }

    // Update cycle as completed
    const { error: updateError } = await supabase
      .from('challenge_cycles')
      .update({
        status: 'completed',
        winner_user_id,
        runner_up_user_id,
        participants_count: leaderboard?.length || 0
      })
      .eq('id', cycle.id);

    if (updateError) throw updateError;

    // Create next cycle for recurring challenges
    if (challenge.challenge_type.includes('recurring')) {
      const cycleLength = challenge.challenge_type === 'weekly_recurring' ? 7 : 30;
      const nextStart = new Date();
      const nextEnd = new Date();
      nextEnd.setDate(nextEnd.getDate() + cycleLength);

      const { error: nextCycleError } = await supabase
        .from('challenge_cycles')
        .insert({
          parent_challenge_id: challenge.id,
          cycle_start: nextStart.toISOString(),
          cycle_end: nextEnd.toISOString(),
          status: 'active'
        });

      if (nextCycleError) {
        console.error('Error creating next cycle:', nextCycleError);
      }

      // Reset leaderboard for new cycle
      const { error: resetError } = await supabase
        .from('walking_leaderboards')
        .update({
          total_steps: 0,
          daily_steps: {},
          last_updated: new Date().toISOString()
        })
        .eq('challenge_id', challenge.id);

      if (resetError) {
        console.error('Error resetting leaderboard:', resetError);
      }
    }

    console.log(`Cycle ${cycle.id} completed successfully`);

  } catch (error) {
    console.error('Error completing cycle:', error);
  }
}

async function awardPoints(supabase: any, leaderboard: any[], challenge: any) {
  console.log('Awarding points to participants...');

  for (let i = 0; i < leaderboard.length; i++) {
    const participant = leaderboard[i];
    let points = 0;
    let description = '';

    if (i === 0) {
      // Winner
      points = challenge.winner_reward_points;
      description = `Winner of ${challenge.title}`;
    } else if (i === 1) {
      // Runner-up
      points = challenge.runner_up_reward_points;
      description = `Runner-up in ${challenge.title}`;
    } else {
      // Participation
      points = challenge.participation_reward_points;
      description = `Participation in ${challenge.title}`;
    }

    if (points > 0) {
      // Insert loyalty transaction
      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: participant.user_id,
          type: 'earned',
          points,
          description,
          reference_type: 'walking_challenge',
          reference_id: challenge.id
        });

      if (transactionError) {
        console.error('Error awarding points:', transactionError);
      } else {
        console.log(`Awarded ${points} points to user ${participant.user_id}`);
      }
    }
  }
}

async function processCompletedCycles(supabase: any) {
  // This function can be used for additional cleanup or reporting
  // For now, we'll just log completed cycles
  const { data: completedCycles } = await supabase
    .from('challenge_cycles')
    .select('*')
    .eq('status', 'completed')
    .gte('cycle_end', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

  console.log(`Found ${completedCycles?.length || 0} recently completed cycles`);
}