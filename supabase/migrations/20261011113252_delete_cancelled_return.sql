create or replace function public.delete_cancelled_return(
  p_return_id bigint
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_header public.return_headers%rowtype;
  v_deleted integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using message = 'NOT_AUTHORIZED';
  end if;

  select *
  into v_header
  from public.return_headers
  where id = p_return_id
  for update;

  if not found then
    raise exception using message = 'RETURN_NOT_FOUND';
  end if;

  if v_header.status is distinct from 'dibatalkan' then
    raise exception using message = 'RETURN_NOT_CANCELLED';
  end if;

  delete from public.return_history
  where return_header_id = p_return_id;

  delete from public.return_items
  where return_header_id = p_return_id;

  delete from public.return_headers
  where id = p_return_id
    and status = 'dibatalkan';

  get diagnostics v_deleted = row_count;

  if v_deleted <> 1 then
    raise exception using message = 'RETURN_DELETE_FAILED';
  end if;

  return jsonb_build_object(
    'id', v_header.id,
    'no_return', v_header.no_return,
    'foto_surat_jalan_url', v_header.foto_surat_jalan_url,
    'foto_material_url', v_header.foto_material_url
  );
end;
$$;

revoke all on function public.delete_cancelled_return(bigint)
  from public, anon, authenticated;

grant execute on function public.delete_cancelled_return(bigint)
  to service_role;
