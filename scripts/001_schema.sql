-- =====================================================================
-- Customer Return Receiving — Supabase schema
-- Idempotent: aman dijalankan berulang kali.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- USERS (profil aplikasi, terhubung ke auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null unique,
  role text not null default 'viewer'
    check (role in ('owner', 'admin', 'operator', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RETURNS (header)
-- status disiapkan untuk workflow lanjutan (verifikasi, disposition, dst.)
-- ---------------------------------------------------------------------
create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  no_return text not null unique,
  tanggal_penerimaan date not null,
  no_sppb text not null check (length(trim(no_sppb)) > 0),
  no_claim text,
  customer text not null check (length(trim(customer)) > 0),
  pic_penerima text,
  catatan text,
  status text not null default 'diterima'
    check (status in ('diterima', 'dibatalkan')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists returns_tanggal_idx on public.returns (tanggal_penerimaan desc);
create index if not exists returns_customer_idx on public.returns (customer);
create index if not exists returns_status_idx on public.returns (status);

-- ---------------------------------------------------------------------
-- RETURN ITEMS (detail, banyak item per header)
-- foto_*_url menyimpan PATH object di bucket "return-photos"
-- ---------------------------------------------------------------------
create table if not exists public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns(id) on delete cascade,
  line_no integer not null default 1,
  diameter text not null check (length(trim(diameter)) > 0),
  tebal numeric(8, 2) not null check (tebal > 0),
  panjang numeric(10, 2) not null check (panjang > 0),
  batch text,
  no_box text,
  qty_surat_jalan numeric(14, 2) not null default 0 check (qty_surat_jalan >= 0),
  qty_aktual_diterima numeric(14, 2) not null default 0 check (qty_aktual_diterima >= 0),
  kondisi_material text not null,
  sloc text,
  foto_material_url text,
  foto_surat_jalan_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists return_items_return_idx on public.return_items (return_id);

-- ---------------------------------------------------------------------
-- RETURN HISTORY (audit log, append-only)
-- on delete restrict: header yang memiliki history tidak dapat dihapus
-- ---------------------------------------------------------------------
create table if not exists public.return_history (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns(id) on delete restrict,
  user_id uuid references public.users(id) on delete set null,
  user_name text,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists return_history_return_idx on public.return_history (return_id, created_at desc);
create index if not exists return_history_created_idx on public.return_history (created_at desc);

-- ---------------------------------------------------------------------
-- COUNTER untuk penomoran RET-YYYYMMDD-XXX
-- ---------------------------------------------------------------------
create table if not exists public.return_counters (
  tanggal date primary key,
  last_seq integer not null default 0
);

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists returns_set_updated_at on public.returns;
create trigger returns_set_updated_at before update on public.returns
  for each row execute function public.set_updated_at();

drop trigger if exists return_items_set_updated_at on public.return_items;
create trigger return_items_set_updated_at before update on public.return_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Helper: role user aktif saat ini
-- ---------------------------------------------------------------------
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.role from public.users u
  where u.id = auth.uid() and u.status = 'active'
$$;

-- ---------------------------------------------------------------------
-- Penomoran otomatis, atomic & unik per tanggal penerimaan
-- ---------------------------------------------------------------------
create or replace function public.next_no_return(p_date date)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seq integer;
begin
  insert into public.return_counters (tanggal, last_seq)
  values (p_date, 1)
  on conflict (tanggal)
  do update set last_seq = public.return_counters.last_seq + 1
  returning last_seq into v_seq;

  return 'RET-' || to_char(p_date, 'YYYYMMDD') || '-' || lpad(v_seq::text, 3, '0');
end;
$$;

revoke all on function public.next_no_return(date) from public, anon;

-- ---------------------------------------------------------------------
-- Profil otomatis saat sign up. User pertama menjadi Owner.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    new.email,
    case when exists (select 1 from public.users) then 'viewer' else 'owner' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- RPC: buat header + items + history dalam satu transaksi
-- security invoker -> RLS tetap berlaku
-- ---------------------------------------------------------------------
create or replace function public.create_return(p_header jsonb, p_items jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_role text := public.current_app_role();
  v_id uuid;
  v_no text;
  v_date date;
  v_item jsonb;
  v_line integer := 0;
  v_user_name text;
begin
  if v_role is null or v_role not in ('owner', 'admin', 'operator') then
    raise exception 'Anda tidak memiliki akses untuk membuat penerimaan return'
      using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Minimal 1 item return' using errcode = '22023';
  end if;

  v_date := (p_header ->> 'tanggal_penerimaan')::date;
  if v_date is null then
    raise exception 'Tanggal penerimaan wajib diisi' using errcode = '22023';
  end if;

  v_no := public.next_no_return(v_date);

  insert into public.returns (
    no_return, tanggal_penerimaan, no_sppb, no_claim, customer,
    pic_penerima, catatan, created_by
  ) values (
    v_no,
    v_date,
    trim(p_header ->> 'no_sppb'),
    nullif(trim(coalesce(p_header ->> 'no_claim', '')), ''),
    trim(p_header ->> 'customer'),
    nullif(trim(coalesce(p_header ->> 'pic_penerima', '')), ''),
    nullif(trim(coalesce(p_header ->> 'catatan', '')), ''),
    auth.uid()
  )
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_line := v_line + 1;
    insert into public.return_items (
      return_id, line_no, diameter, tebal, panjang, batch, no_box,
      qty_surat_jalan, qty_aktual_diterima, kondisi_material, sloc,
      foto_material_url, foto_surat_jalan_url
    ) values (
      v_id,
      v_line,
      trim(v_item ->> 'diameter'),
      (v_item ->> 'tebal')::numeric,
      (v_item ->> 'panjang')::numeric,
      nullif(trim(coalesce(v_item ->> 'batch', '')), ''),
      nullif(trim(coalesce(v_item ->> 'no_box', '')), ''),
      (v_item ->> 'qty_surat_jalan')::numeric,
      (v_item ->> 'qty_aktual_diterima')::numeric,
      trim(v_item ->> 'kondisi_material'),
      nullif(trim(coalesce(v_item ->> 'sloc', '')), ''),
      nullif(v_item ->> 'foto_material_url', ''),
      nullif(v_item ->> 'foto_surat_jalan_url', '')
    );
  end loop;

  select u.name into v_user_name from public.users u where u.id = auth.uid();

  insert into public.return_history (return_id, user_id, user_name, action, old_data, new_data, notes)
  values (
    v_id,
    auth.uid(),
    v_user_name,
    'Membuat penerimaan return',
    null,
    jsonb_build_object(
      'customer', trim(p_header ->> 'customer'),
      'no_sppb', trim(p_header ->> 'no_sppb'),
      'jumlah_item', v_line
    ),
    null
  );

  return jsonb_build_object('id', v_id, 'no_return', v_no);
end;
$$;

revoke all on function public.create_return(jsonb, jsonb) from public, anon;
grant execute on function public.create_return(jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- VIEW ringkasan header + agregat item (RLS mengikuti pemanggil)
-- ---------------------------------------------------------------------
create or replace view public.return_summary
with (security_invoker = true) as
select
  r.id,
  r.no_return,
  r.tanggal_penerimaan,
  r.no_sppb,
  r.no_claim,
  r.customer,
  r.pic_penerima,
  r.catatan,
  r.status,
  r.created_by,
  r.created_at,
  r.updated_at,
  count(i.id)::int as item_count,
  coalesce(sum(i.qty_surat_jalan), 0)::numeric as total_qty_sj,
  coalesce(sum(i.qty_aktual_diterima), 0)::numeric as total_qty_aktual,
  (count(i.id) filter (where i.qty_surat_jalan <> i.qty_aktual_diterima))::int as selisih_count
from public.returns r
left join public.return_items i on i.return_id = r.id
group by r.id;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.returns enable row level security;
alter table public.return_items enable row level security;
alter table public.return_history enable row level security;
alter table public.return_counters enable row level security;

-- users
drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated
  using (id = auth.uid() or public.current_app_role() is not null);

drop policy if exists users_update_owner on public.users;
create policy users_update_owner on public.users for update to authenticated
  using (public.current_app_role() = 'owner')
  with check (public.current_app_role() = 'owner');

-- returns
drop policy if exists returns_select on public.returns;
create policy returns_select on public.returns for select to authenticated
  using (public.current_app_role() is not null);

drop policy if exists returns_insert on public.returns;
create policy returns_insert on public.returns for insert to authenticated
  with check (
    public.current_app_role() in ('owner', 'admin', 'operator')
    and created_by = auth.uid()
  );

drop policy if exists returns_update on public.returns;
create policy returns_update on public.returns for update to authenticated
  using (public.current_app_role() in ('owner', 'admin'))
  with check (public.current_app_role() in ('owner', 'admin'));

-- return_items
drop policy if exists return_items_select on public.return_items;
create policy return_items_select on public.return_items for select to authenticated
  using (public.current_app_role() is not null);

drop policy if exists return_items_insert on public.return_items;
create policy return_items_insert on public.return_items for insert to authenticated
  with check (
    public.current_app_role() in ('owner', 'admin')
    or (
      public.current_app_role() = 'operator'
      and exists (
        select 1 from public.returns r
        where r.id = return_items.return_id and r.created_by = auth.uid()
      )
    )
  );

drop policy if exists return_items_update on public.return_items;
create policy return_items_update on public.return_items for update to authenticated
  using (public.current_app_role() in ('owner', 'admin'))
  with check (public.current_app_role() in ('owner', 'admin'));

drop policy if exists return_items_delete on public.return_items;
create policy return_items_delete on public.return_items for delete to authenticated
  using (public.current_app_role() in ('owner', 'admin'));

-- return_history: append-only (tanpa policy update/delete)
drop policy if exists return_history_select on public.return_history;
create policy return_history_select on public.return_history for select to authenticated
  using (public.current_app_role() is not null);

drop policy if exists return_history_insert on public.return_history;
create policy return_history_insert on public.return_history for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.current_app_role() in ('owner', 'admin', 'operator')
  );

-- ---------------------------------------------------------------------
-- STORAGE: bucket privat untuk foto material & surat jalan
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('return-photos', 'return-photos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists return_photos_select on storage.objects;
create policy return_photos_select on storage.objects for select to authenticated
  using (bucket_id = 'return-photos' and public.current_app_role() is not null);

drop policy if exists return_photos_insert on storage.objects;
create policy return_photos_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'return-photos'
    and public.current_app_role() in ('owner', 'admin', 'operator')
  );
