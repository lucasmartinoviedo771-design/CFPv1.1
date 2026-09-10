export interface DistributionItem {
  name: string;
  count: number;
}

export interface CrossMatrixItem {
  year: string;
  program: string;
  unique_students: number;
  graduated: number;
}

export interface FirstEntryItem {
  year: string;
  count: number;
}

export interface SexDistribution {
  mujeres: number;
  varones: number;
  otro: number;
  sin_especificar: number;
  total: number;
  mujeres_pct: number;
  varones_pct: number;
}

export interface AuditRecordItem {
  id: number;
  person_id: string;
  name: string;
  dni: string;
  city: string;
  sexo?: string;
  sexo_raw?: string;
  education: string;
  regular: string;
  is_active: boolean;
  program: string;
  program_id: number;
  block: string;
  module: string;
  cohort: string;
  year: string;
  month: string;
  state: string;
  status: string;
  reason: string;
  enroll: string;
  grade: string;
  qualified: string;
}

export interface PaginatedRecords {
  items: AuditRecordItem[];
  total: number;
  page: number;
  total_pages: number;
}

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
  unique_students_count: number;
  active_students_count: number;
  graduated_students_count: number;
  program_graduations_count: number;
  in_course_students_count: number;
  total_records: number;
  attendance_rate: number;
  pass_rate: number;
  by_year: DistributionItem[];
  by_program: DistributionItem[];
  by_status: DistributionItem[];
  by_block: DistributionItem[];
  by_cohort: DistributionItem[];
  by_month: DistributionItem[];
  by_city: DistributionItem[];
  by_education: DistributionItem[];
  by_sex?: DistributionItem[];
  sex_distribution?: SexDistribution;
  first_entries: FirstEntryItem[];
  cross_matrix: CrossMatrixItem[];
  records?: PaginatedRecords;
  programs_chart?: ProgramChart | null;
  yearly_trend?: YearlyTrendItem[] | null;
  active_breakdown?: ProgramBreakdownItem[] | null;
  graduated_breakdown?: ProgramBreakdownItem[] | null;
  pass_breakdown?: {
    by_program: PassRateItem[];
    by_block: PassRateItem[];
  } | null;
}
