import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { User, AuthError, AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Goal } from '../types/goal';

// This is the hardcoded CSV data from populate-data-simple.js
const csvData = `,Dimension,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,Jan,Feb,Mar,Goals
Personal Annual Plan,Family,Move to Florida; ,Choose initial simple home-learning activity,"Enroll Deusie in structured group classes (sports, arts, etc.)",Establish consistent daily educational/play routine,Regularly attend structured social activities/classes,Participate in local parent-child social groups,Arrange first casual playdate from structured group contacts,Evaluate progress in educational/social activities; ,Increase frequency of structured activities for socializing,Regular review and adjustment of home-learning activities,Evaluate yearly progress and adjust plans accordingly,Finalize clear next year's education/socialization plan,Deusie is educated without nanny: Montessori school or home-schooling; 
,,explore Montessori/home-schooling options,,,,,,,,,,,,Deusie socializes and makes friends: gym or something; 
,,,,,,,,,adjust if needed,,,,,We live in warm climate; 
,Health,Find dentist in Florida; ,Address immediate tooth pain; ,Begin addressing remaining dental issues,Evaluate ergonomic home/work setup;,Establish consistent routine for teeth protection at night,Identify effective relaxation method before bedtime,"Implement nightly stress-reduction ritual (meditation, stretches)",Evaluate sleep quality and adjust sleeping arrangements,Regular check-in with dentist; ,Incorporate gentle daily exercise (yoga or stretching),Reassess ergonomic setup effectiveness; ,Annual dental check-up; ,No pain in the teeth
,,schedule initial appointment,,,,,,,,,,,,Healthy stress-less sleep
,,,create dental care plan,,,,,,,,,,,"No pain while working, driving, or crafting"
,Wealth,List Hawaii home for sale; ,Negotiate Hawaii sale; ,Finalize Hawaii home sale; ,Settle family into rented home;,"Invest home sale proceeds into diversified, conservative portfolio",List business for sale; ,Negotiate sale terms; ,Finalize business sale;,Evaluate passive income; ,Review investment portfolio performance;,Refine long-term financial strategy;,Establish clear financial roadmap for next year,$4-5M in liquid capital
,,move into Florida Airbnb,find furnished long-term rental in Florida,move into long-term Florida rental,establish isolated workspace,,refine pitch/valuation,secure buyer for business, reinvest conservatively for stable income,optimize expenses to maximize liquidity,,,,"dog has a place to poop; I have a place to work, float and sunbathe"
,,,,,,,,,,, adjust as needed, liquidity-focused,,"I have a stable capital gain income to provide for family, and be creative"
,Self-realization,Set up personal website/Substack (Russian),Publish first new article in Russian,"Develop clear concept & sober writing plan for ""Code of Life""","Write/revise ""Code of Life""; monthly progress check-in",Share monthly insights/articles on Substack/website,Develop concept/demo for Bun's Adventures or Anti MMO game,Build basic playable prototype for the game,Post monthly game development updates and gather feedback,"Complete full draft of ""Code of Life"" script",Host online event/Q&A about insights & game progress,Collaborate with influencer to promote content/game,Evaluate year's progress; set clear next goals,I'm openly sharing my experiences and insights with the world
,,,,,,,,,,,,,,I'm developing an engaging 3D game
,,,,,,,,,,,,,,
,Friends,Join local sober or outdoor-interest groups,Regularly attend chosen sober/outdoor interest groups/events,Introduce yourself to at least one new acquaintance,Initiate casual meet-up with new acquaintance(s),Establish weekly routine for sober/outdoor social interactions,Identify and nurture deeper connections within groups,Participate in shared outdoor activity or sober social event,Regularly engage in meaningful activities with new friends,Deepen relationships; ,Reflect on friendships built; ,Plan continued friendship-building activities for coming year,Establish clear goals for maintaining sober friendships,I have at least one sober friend to spend time with every week
,,,,,,,,,,host or organize casual group events,assess satisfaction,,,
,,,,,,,,,,,,,,
,Leisure,Research easy travel logistics for Puerto Rico,Plan itinerary/logistics for family trip to Puerto Rico,Take family vacation (Puerto Rico); ,Document family feedback; ,"Research easy-access snowy locations (Colorado, Vermont)",Book suitable snowy destination family vacation,Prepare logistics/travel details for winter vacation,Enjoy snowy vacation;,Reflect on leisure trips; ,Discuss and shortlist next year's vacation options,Establish realistic leisure travel budget,Finalize clear leisure/travel goals for coming year,Take a vacation in Puerto Rico
,,,,evaluate relocation potential,assess practicality of potential move,,,, document experiences and family enjoyment,discuss future travel interests,,,,Snowy vacation in Colorado/Vermont`;

function parseAndPrepareGoalsForMigration(userId: string): Omit<Goal, 'id' | 'created_at' | 'updated_at'>[] {
  const goalsToCreate: Omit<Goal, 'id' | 'created_at' | 'updated_at'>[] = [];
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');

  const monthHeaderMap: Record<string, number> = {
    Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9,
    Oct: 10, Nov: 11, Dec: 12, Jan: 1, Feb: 2, Mar: 3
  };

  let currentDimension: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');
    const dimensionName = cells[1]?.trim();

    if (dimensionName && dimensionName !== '') {
      currentDimension = dimensionName.toLowerCase(); // We don't store dimension in the Goal type for now
    }

    if (currentDimension) {
      headers.forEach((header, colIndex) => {
        const monthNum = monthHeaderMap[header.trim()];
        if (monthNum && cells[colIndex] && cells[colIndex].trim() !== '') {
          const year = (monthNum >= 1 && monthNum <= 3) ? 2026 : 2025;
          cells[colIndex].split(';').forEach(desc => {
            if (desc.trim()) {
              goalsToCreate.push({
                user_id: userId,
                description: desc.trim(),
                type: 'monthly',
                month: monthNum,
                year: year,
                is_completed: false,
                order_index: 0,
              });
            }
          });
        }
      });

      const annualGoalIndex = headers.indexOf('Goals');
      if (annualGoalIndex !== -1 && cells[annualGoalIndex] && cells[annualGoalIndex].trim() !== '') {
        cells[annualGoalIndex].split(';').forEach(desc => {
          if (desc.trim()) {
            goalsToCreate.push({
              user_id: userId,
              description: desc.trim(),
              type: 'annual',
              month: null,
              year: 2025, 
              is_completed: false,
              order_index: 0,
            });
          }
        });
      }
    }
  }
  return goalsToCreate;
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const migrateInitialData = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { count, error: countError } = await supabase
        .from('goals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;
      if (count !== null && count > 0) {
        console.log('User already has goals, skipping migration.');
        return;
      }

      const goalsToMigrate = parseAndPrepareGoalsForMigration(userId);
      if (goalsToMigrate.length > 0) {
        const { error: insertError } = await supabase.from('goals').insert(goalsToMigrate);
        if (insertError) throw insertError;
        console.log('Initial data migrated successfully for user:', userId);
      }
    } catch (e: any) {
      console.error('Error migrating initial data:', e);
      // setError(e); // Consider how to surface this specific error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setCurrentUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        // Initial check if migration is needed
         migrateInitialData(initialSession.user.id);
      }
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession);
        setCurrentUser(newSession?.user ?? null);
        if (event === 'SIGNED_IN' && newSession?.user) {
          // Check if this is truly the first user or if data needs migration
          await migrateInitialData(newSession.user.id);
        }
      }
    );
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [migrateInitialData]);

  const signUp = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      // currentUser will be set by onAuthStateChange
      return data.user;
    } catch (e: any) {
      setError(e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      // currentUser will be set by onAuthStateChange
      return data.user;
    } catch (e: any) {
      setError(e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      // currentUser will be set by onAuthStateChange
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return {
    currentUser,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
  };
} 