-- Vouchers for friends and influencers: Apple offer codes on a hidden 2-credit pack.
-- It is never sold in the app (on_sale = false); the codes are created in App Store Connect.
alter table public.credit_packs add column on_sale boolean not null default true;
insert into public.credit_packs (product_id, credits, sort_order, on_sale)
values ('app.petbubble.credits.2', 2, 0, false);
