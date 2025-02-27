import { useState } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from './ui/use-toast';

interface Props {
  onUpdate?: () => void;
}

type SelectionWithHorse = {
  id: string;
  user_id: string;
  horse_id: string;
  chip: 'superBoost' | 'doubleChance' | 'tripleThreat' | null;
  fantasy_horses: {
    id: string;
    fixed_odds: number;
    result: 'win' | 'place' | 'loss' | null;
    race_id: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
}

export function UpdateLeagueTable({ onUpdate }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);

  const calculatePoints = (result: 'win' | 'place' | 'loss' | null, odds: number, chip: 'superBoost' | 'doubleChance' | 'tripleThreat' | null = null) => {
    if (!result) return 0;
    
    let points = 0;
    let isWin = result === 'win';
    let isPlace = result === 'place';
    let isLoss = result === 'loss';

    // Handle Double Chance chip - converts place to win
    if (chip === 'doubleChance' && isPlace) {
      isWin = true;
      isPlace = false;
    }

    // Calculate base points
    if (isWin) {
      points = Math.round(odds * 10); // Base points for a win
    } else if (isPlace) {
      points = Math.round((odds * 10) / 4); // Quarter points for a place
    }

    // Apply chip multipliers
    if (chip === 'superBoost' && isWin) {
      points *= 10; // 10x points for super boost win
    } else if (chip === 'tripleThreat') {
      if (isWin) {
        points *= 3; // Triple points for win
      } else if (isLoss) {
        // Calculate what points would have been for a win, then make negative and triple
        points = Math.round(odds * 10) * -3;
      }
    }

    return points;
  };

  const handleUpdateLeagueTable = async () => {
    try {
      setIsUpdating(true);

      // 1. Fetch all user selections with their results
      const { data: selections, error: selectionsError } = await supabase
        .from('fantasy_selections')
        .select(`
          id,
          user_id,
          horse_id,
          chip,
          fantasy_horses!inner(
            id,
            fixed_odds,
            result,
            race_id,
            name,
            created_at,
            updated_at
          )
        `)
        .returns<SelectionWithHorse[]>();

      if (selectionsError) throw selectionsError;
      if (!selections) return;

      // 2. Calculate points for each user
      const userPoints: { [key: string]: number } = {};
      
      selections.forEach(selection => {
        const points = calculatePoints(
          selection.fantasy_horses.result,
          selection.fantasy_horses.fixed_odds,
          selection.chip
        );
        
        if (!userPoints[selection.user_id]) {
          userPoints[selection.user_id] = 0;
        }
        userPoints[selection.user_id] += points;
      });

      // 3. Update league_standings table
      for (const [userId, points] of Object.entries(userPoints)) {
        const { error: updateError } = await supabase
          .from('fantasy_league_standings')
          .update({ total_points: points, updated_at: new Date().toISOString() })
          .eq('user_id', userId);

        if (updateError) {
          // If no row exists yet, create it
          const { error: insertError } = await supabase
            .from('fantasy_league_standings')
            .insert({
              user_id: userId,
              total_points: points,
              updated_at: new Date().toISOString()
            });
          
          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Success",
        description: "League table has been updated successfully",
      });

      // Trigger refresh of league standings if callback provided
      if (onUpdate) {
        onUpdate();
      }

    } catch (error) {
      console.error('Error updating league table:', error);
      toast({
        title: "Error",
        description: "Failed to update league table. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button 
      onClick={handleUpdateLeagueTable}
      disabled={isUpdating}
      variant="outline"
      size="sm"
    >
      {isUpdating ? "Updating..." : "Update League Table"}
    </Button>
  );
}
