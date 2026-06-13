export interface ProgramBreakdownCohort {
  name: string;
  count: number;
}

export interface ProgramBreakdownItem {
  name: string;
  count: number;
  cohorts: ProgramBreakdownCohort[];
}

export interface ProgramChart {
  labels: string[];
  counts: number[];
}

export interface YearlyTrendItem {
  year: string | number;
  count: number;
}

export interface PassRateItem {
  name: string;
  rate: number;
}

export interface ExtendedDashboardStats {
  active_students_count?: number | null;
  graduated_students_count?: number | null;
  attendance_rate?: number | null;
  pass_rate?: number | null;
  programs_chart?: ProgramChart | null;
  yearly_trend?: YearlyTrendItem[] | null;
  active_breakdown?: ProgramBreakdownItem[] | null;
  graduated_breakdown?: ProgramBreakdownItem[] | null;
  pass_breakdown?: {
    by_program: PassRateItem[];
    by_block: PassRateItem[];
  } | null;
}
