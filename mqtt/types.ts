export interface Race {
    race: RaceClass;
    current_heat: Heat;
    upcoming_heats: Heat[];
    progress: Progress;
    timestamp: Date;
  }
  
  export interface Heat {
    heat_number: number;
    status: string;
    racers: Racer[];
    scheduled_order?: number;
  }
  
  export interface Racer {
    track_number: number;
    racer_id: string;
    racer_name: string;
    racer_number: number;
    current_time: number;
  }
  
  export interface Progress {
    total_heats: number;
    completed_heats: number;
    remaining_heats: number;
    percent_complete: number;
  }
  
  export interface RaceClass {
    id: string;
    name: string;
    date: Date;
  }