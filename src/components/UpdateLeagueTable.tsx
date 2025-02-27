import { useState } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from './ui/use-toast';

interface Props {
  onUpdate?: () => void;
}

interface FantasyHorse {
  id: string;
  fixed_odds: number;
  result: 'win' | 'place' | 'loss' | null;
  race_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface SelectionWithHorse {
  id: string;
  user_id: string;
  horse_id: string;
  chip: 'superBoost' | 'doubleChance' | 'tripleThreat' | null;
  fantasy_horses: FantasyHorse;
}

export function UpdateLeagueTable({ onUpdate }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);

  const calculatePoints = (result: 'win' | 'place' | 'loss' | null, odds: number, chip: 'superBoost' | 'doubleChance' | 'tripleThreat' | null = null) => {
    console.log('Calculating points for:', { result, odds, chip });
    
    if (!result) return 0;
    
    // Make sure odds are in decimal format
    let decimalOdds = odds;
    
    // Log the odds being used for calculation
    console.log(`Using decimal odds: ${decimalOdds}`);
    
    let points = 0;
    let isWin = result === 'win';
    let isPlace = result === 'place';
    let isLoss = result === 'loss';

    // Handle Double Chance chip - converts place to win
    if (chip === 'doubleChance' && isPlace) {
      isWin = true;
      isPlace = false;
      console.log('Double Chance activated: converting place to win');
    }

    // Calculate points based on the odds ranges
    if (isWin) {
      // Win points based on odds ranges
      if (decimalOdds <= 3) { // Up to 2/1 (decimal 3.0)
        points = 15;
        console.log(`Win points for odds up to 2/1: ${points}`);
      } else if (decimalOdds <= 5) { // Up to 4/1 (decimal 5.0)
        points = 20;
        console.log(`Win points for odds up to 4/1: ${points}`);
      } else if (decimalOdds <= 9) { // Up to 8/1 (decimal 9.0)
        points = 25;
        console.log(`Win points for odds up to 8/1: ${points}`);
      } else { // Over 8/1 (decimal > 9.0)
        points = 30;
        console.log(`Win points for odds over 8/1: ${points}`);
      }
    } else if (isPlace) {
      // Place points based on odds ranges
      if (decimalOdds <= 3) { // Up to 2/1
        points = 5;
        console.log(`Place points for odds up to 2/1: ${points}`);
      } else if (decimalOdds <= 5) { // Up to 4/1
        points = 7;
        console.log(`Place points for odds up to 4/1: ${points}`);
      } else if (decimalOdds <= 9) { // Up to 8/1
        points = 10;
        console.log(`Place points for odds up to 8/1: ${points}`);
      } else { // Over 8/1
        points = 12;
        console.log(`Place points for odds over 8/1: ${points}`);
      }
    }

    // Apply chip multipliers
    if (chip === 'superBoost' && isWin) {
      points *= 10; // 10x points for super boost win
      console.log('Points after super boost:', points);
    } else if (chip === 'tripleThreat') {
      if (isWin) {
        points *= 3; // Triple points for win
        console.log('Points after triple threat win:', points);
      } else if (isLoss) {
        // For loss, use the win points but make them negative and triple them
        let lossPoints = 0;
        if (decimalOdds <= 3) lossPoints = 15;
        else if (decimalOdds <= 5) lossPoints = 20;
        else if (decimalOdds <= 9) lossPoints = 25;
        else lossPoints = 30;
        
        points = lossPoints * -3;
        console.log('Points after triple threat loss:', points);
      }
    }

    console.log('Final points:', points);
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
          fantasy_horses (
            id,
            fixed_odds,
            result,
            race_id,
            name,
            created_at,
            updated_at
          )
        `)
        .not('submitted_at', 'is', null)
        .returns<SelectionWithHorse[]>();

      if (selectionsError) throw selectionsError;
      if (!selections) return;

      console.log('Found selections:', selections);

      // 2. Calculate points for each user
      const userPoints: { [key: string]: number } = {};
      
      selections.forEach(selection => {
        const horse = selection.fantasy_horses;
        // Parse odds ensuring we get the correct decimal value
        let odds = parseFloat(horse.fixed_odds.toString());
        
        // Debug the raw value to understand what's happening
        console.log('Raw fixed_odds value:', horse.fixed_odds, 'Type:', typeof horse.fixed_odds);
        
        // Convert from fractional ratio to decimal odds if needed
        // E.g., If odds of "1/2" are stored as 0.5 (ratio), convert to 1.5 (decimal)
        if (odds < 1) {
          console.log(`Odds ${odds} appears to be stored as a ratio, converting to decimal`);
          odds = 1 + odds;
        }
        
        // Log for UK fractional format reference:
        // 1/1 (evens) = 2.0 decimal
        // 2/1 = 3.0 decimal
        // 4/1 = 5.0 decimal
        // 8/1 = 9.0 decimal
        // 1/2 = 1.5 decimal
        console.log('Processing selection with decimal odds:', odds);
        
        const points = calculatePoints(
          horse.result,
          odds,
          selection.chip
        );
        
        if (!userPoints[selection.user_id]) {
          userPoints[selection.user_id] = 0;
        }
        userPoints[selection.user_id] += points;
        console.log(`User ${selection.user_id} now has ${userPoints[selection.user_id]} points`);
      });

      console.log('Final user points:', userPoints);

      // 3. Update league_standings table
      for (const [userId, points] of Object.entries(userPoints)) {
        console.log(`Updating standings for user ${userId} with ${points} points`);
        
        try {
          // Try update first
          const { data, error: updateError } = await supabase
            .from('fantasy_league_standings')
            .update({ 
              total_points: points,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

          if (updateError) {
            console.log('Update failed, trying insert:', updateError);
            // If update fails, try insert
            const { error: insertError } = await supabase
              .from('fantasy_league_standings')
              .insert({ 
                user_id: userId,
                total_points: points,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error('Insert failed:', insertError);
              throw insertError;
            } else {
              console.log(`Successfully created standings for user ${userId}`);
            }
          } else {
            console.log(`Successfully updated standings for user ${userId}`);
          }
        } catch (error) {
          console.error('Error updating standings:', error);
          throw error;
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
