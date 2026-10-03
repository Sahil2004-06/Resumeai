insert into storage.buckets (id, name, public) values ('resume-uploads', 'resume-uploads', false), ('resume-exports', 'resume-exports', false) on conflict (id) do nothing;

create policy "Users can upload their resume files" on storage.objects for insert to authenticated with check (bucket_id = 'resume-uploads' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users can read their resume uploads" on storage.objects for select to authenticated using (bucket_id = 'resume-uploads' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users can delete their resume uploads" on storage.objects for delete to authenticated using (bucket_id = 'resume-uploads' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users can read their resume exports" on storage.objects for select to authenticated using (bucket_id = 'resume-exports' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users can upload their resume exports" on storage.objects for insert to authenticated with check (bucket_id = 'resume-exports' and (storage.foldername(name))[1] = (select auth.uid()::text));
