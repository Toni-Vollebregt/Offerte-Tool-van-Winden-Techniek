-- Create tarieven table
create table tarieven (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  omschrijving text,
  uurtarief decimal(10,2) not null,
  aangemaakt timestamp default now()
);

-- Create offertes table
create table offertes (
  id uuid default gen_random_uuid() primary key,
  maand text,
  jaar integer,
  totaal decimal(10,2),
  data jsonb,
  aangemaakt timestamp default now()
);

-- Create facturen table
create table if not exists facturen (
  id uuid default gen_random_uuid() primary key,
  maand text,
  jaar integer,
  totaal decimal(10,2),
  data jsonb,
  aangemaakt timestamp default now()
);

-- Create instellingen table (key/value voor reiskosten tarieven)
create table if not exists instellingen (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text,
  aangemaakt timestamp default now()
);

-- Insert default tarieven
insert into tarieven (code, omschrijving, uurtarief) values
  ('O-G', 'Onderhoud Garagedeuren', 60.00),
  ('O-R', 'Onderhoud Roldeuren', 60.00),
  ('O-B', 'Onderhoud Borstels', 67.00),
  ('O-O', 'Onderhoud Overig', 65.00),
  ('O-V', 'Onderhoud Vliegendeuren', 60.00),
  ('O-VB', 'Onderhoud Vluchtbalken', 67.00),
  ('O-VGB', 'Onderhoud VG Balken', 67.00),
  ('O-RIVG', 'Onderhoud RI VG', 55.00),
  ('O-VG', 'Onderhoud Veiligheidsgordijnen', 60.00),
  ('O-VG+REINIGEN', 'Onderhoud VG + Reinigen', 60.00),
  ('PAC/MOBIEL', 'ONDERHOUD PAC EN MOBIEL ABONNEMENT', 60.00),
  ('O-ROLSCHERMEN', 'Onderhoud Rolschermen', 55.00),
  ('O-BEHEER BMI/RWA', 'Onderhoud Beheer BMI/RWA', 65.00),
  ('STORINGEN', 'Storingen Arbeidsuren', 60.00)
on conflict (code) do nothing;

-- Insert default reiskosten instellingen
insert into instellingen (key, value) values
  ('km_tarief', '0.50'),
  ('reis_uur_tarief', '55'),
  ('filemarge', '1.15')
on conflict (key) do nothing;
