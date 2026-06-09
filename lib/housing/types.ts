export type HousingSource = { title: string; url: string };
export type Neighborhood = { name: string; note?: string };
export type FindPortal = { name: string; url?: string };

export type HousingCity = {
  city: string;
  country: string;
  currency: string;
  rent_room_min: number | null;
  rent_room_max: number | null;
  rent_studio_min: number | null;
  rent_studio_max: number | null;
  rent_shared_min: number | null;
  rent_shared_max: number | null;
  monthly_living_min: number | null;
  monthly_living_max: number | null;
  student_neighborhoods: Neighborhood[] | null;
  how_to_find: FindPortal[] | null;
  deposit_norms: string | null;
  tips: string | null;
  sources: HousingSource[] | null;
  researched_on: string | null;
};

export type HousingUniversity = {
  has_dorms: boolean | null;
  dorm_note: string | null;
  housing_office_url: string | null;
  currency: string;
  on_campus_monthly_min: number | null;
  on_campus_monthly_max: number | null;
  near_campus_monthly_min: number | null;
  near_campus_monthly_max: number | null;
  commute_note: string | null;
  tips: string | null;
  sources: HousingSource[] | null;
  researched_on: string | null;
};
